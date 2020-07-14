import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Handlebars from 'handlebars';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

import { RESERVATION_PERIOD, REMINDER_PERIOD, TIME_ZONE_UTC_OFFSET } from './constants';

let smsTemplateSources = require('./messages.json');

admin.initializeApp();

let db = admin.firestore();

let smsTemplates: { [locale: string]: { [key: string]: Handlebars.TemplateDelegate } } = {};
for (let locale of Object.keys(smsTemplateSources)) {
    smsTemplates[locale] = {};
    for (let msg of Object.keys(smsTemplateSources[locale])) {
        smsTemplates[locale][msg] = Handlebars.compile(smsTemplateSources[locale][msg]);
    }
}

export const processSlotReservation = functions
    .region('europe-west1')
    .firestore
    .document("reservations/{reservationId}")
    .onCreate((document) => {
        let { giftId, slotId } = document.data();
        return db.runTransaction(async tx => {
            let giftRef = db.collection('gifts').doc(giftId);
            let slotRef = db.collection('slots').doc(slotId);
            let [slot, prevGift] = await Promise.all([tx.get(slotRef), tx.get(giftRef)]);
            let slotChanged = prevGift.exists && prevGift.data()!.slotId && slotId !== prevGift.data()!.slotId;
            let prevSlotRef = slotChanged ? db.collection('slots').doc(prevGift.data()!.slotId) : undefined;
            let prevSlot = prevSlotRef && await tx.get(prevSlotRef);
            // Slot is available if its status is available or if it was already reserved for this gift.
            let slotAvailable = slot.exists && (slot.data()!.status === 'available' || !slotChanged);
            if (slotAvailable) {
                await tx.set(giftRef, {
                    slotId,
                    reservationId: document.id,
                    reservedUntil: Date.now() + RESERVATION_PERIOD
                }, { merge: true });
                // Set slot as reserved.
                await tx.set(slotRef, { status: 'reserved' }, { merge: true });
                // Set previous slot as available again.
                if (prevSlot) {
                    await tx.set(prevSlotRef!, { status: 'available' }, { merge: true });
                }
            } else {
                await tx.set(giftRef, { slotId: admin.firestore.FieldValue.delete(), reservationId: document.id }, { merge: true });
            }
        });
    });

export const expireUnfinishedGifts = functions.region('europe-west1').pubsub.schedule('every 1 minutes').onRun(async () => {
    let creatingGifts = await db.collection('gifts').where('status', '==', 'creating').get();
    creatingGifts.forEach(doc => {
        let data = doc.data();
        if (data.slotId && data.reservedUntil < Date.now()) {
            db.runTransaction(async tx => {
                let giftRef = db.collection('gifts').doc(doc.id);
                let slotRef = db.collection('slots').doc(data.slotId);
                await tx.set(giftRef, { slotId: admin.firestore.FieldValue.delete() }, { merge: true });
                await tx.set(slotRef, { status: 'available' }, { merge: true });
            });
        }
    });
});

export const ensureGiftCreatingStatus = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onCreate((snap) => {
        return snap.ref.set({ status: 'creating' }, { merge: true })
    });

export const createGiftSMS = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onWrite(async (change, context) => {
        let document = change.after.exists ? change.after.data() : null;
        let previousDocument = change.before.exists ? change.before.data() : null;
        let eventId = context.eventId;
        if (document && previousDocument && document.status === 'pending' && previousDocument.status === 'creating') {
            await createMessage(change.after.id, document, 'giftCreated', eventId);
        } else if (document && previousDocument && document.status === 'confirmed' && previousDocument.status === 'pending') {
            await createMessage(change.after.id, document, 'giftConfirmed', eventId);
        }
        return Promise.resolve()
    });

export const createGiftReminderSMSs = functions.region('europe-west1').pubsub.schedule('every 1 hours').onRun(async () => {
    let confirmedGifts = await db.collection('gifts').where('status', '==', 'confirmed').get();
    confirmedGifts.forEach(async (gift) => {
        let giftData = gift.data();
        let { date, time } = await (await db.collection('slots').doc(giftData.slotId).get()).data()!;
        let giftDate = new Date(
            +date.substring(0, 4),
            +(date.substring(4, 6) - 1),
            +date.substring(6, 8),
            +time.substring(0, 2),
            +time.substring(3, 5)
        );
        let giftTimestamp = giftDate.getTime() - TIME_ZONE_UTC_OFFSET * 60 * 60 * 1000;
        if (giftTimestamp - Date.now() < REMINDER_PERIOD) {
            let giftMessages = await db.collection('SMSs').where('giftId', '==', gift.id).get();
            let existingReminder = giftMessages.docs.find(d => d.data().messageKey === 'giftReminder');
            if (!existingReminder) {
                let template = smsTemplates[giftData.fromLanguage || 'en'].giftReminder;
                let baseUrl = functions.config().artgift.baseurl;
                let message = template({
                    dateTime: `${formatDate(date)} ${formatTime(time)}`,
                    address: giftData.toAddress,
                    url: new Handlebars.SafeString(`${baseUrl}/gift?id=${gift.id}`)
                });
                db.collection('SMSs').add({
                    message,
                    toNumber: giftData.fromPhoneNumber,
                    giftId: gift.id,
                    messageKey: 'giftReminder',
                    sent: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                })
            }
        }
    })
});


async function createMessage(giftId: string, giftDocument: FirebaseFirestore.DocumentData, messageKey: string, eventId: string) {
    let messageRef = db.collection('SMSs').doc(eventId);
    if (await shouldCreate(messageRef)) {
        let slot = await (await db.collection('slots').doc(giftDocument.slotId).get()).data();
        let template = smsTemplates[giftDocument.fromLanguage || 'en'][messageKey];
        let baseUrl = functions.config().artgift.baseurl;
        let message = template({
            dateTime: `${formatDate(slot!.date)} ${formatTime(slot!.time)}`,
            address: giftDocument.toAddress,
            url: new Handlebars.SafeString(`${baseUrl}/gift?id=${giftId}`)
        });
        messageRef.set({
            message,
            toNumber: giftDocument.fromPhoneNumber,
            giftId,
            messageKey,
            sent: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    }
}

function shouldCreate(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.get().then(smsDoc => {
        return !smsDoc.exists;
    });
}

export const sendGiftSMSs = functions.region('europe-west1').pubsub.schedule('every 2 minutes').onRun(async () => {
    let unsentMessages = await db.collection('SMSs').where('sent', '==', false).get();
    unsentMessages.forEach(async doc => {
        let { message, toNumber, createdAt } = doc.data()!;
        if (createdAt.toMillis() < Date.now() - 2 * 60 * 1000) {
            await sendMessage(message, toNumber);
            doc.ref.set({ sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
    });
});

function sendMessage(message: string, toNumber: string) {
    let cfg = functions.config();
    let smsApiUrl = cfg.artgift.smsapi.url;
    let smsApiUsername = cfg.artgift.smsapi.username;
    let smsApiPassword = cfg.artgift.smsapi.password;
    let params = new URLSearchParams();
    params.append('sms_username', smsApiUsername);
    params.append('sms_password', smsApiPassword);
    params.append('sms_dest', normalisePhoneNumber(toNumber));
    params.append('sms_unicode', hexEncode(message));
    return fetch(smsApiUrl, {
        method: 'POST',
        body: params
    }).then(res => res.text()).then(resText => {
        let [status, message] = resText.split('\n');
        if (status === 'OK') {
            return true;
        } else {
            throw new Error('SMS API error: ' + message);
        }
    })
}

function normalisePhoneNumber(number: string) {
    if (number.startsWith('0')) {
        return '+358' + number.substring(1);
    } else if (number.startsWith('358')) {
        return '+' + number;
    } else {
        return number;
    }
}

function hexEncode(str: string) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        let hex = str.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }
    return result
}

function formatDate(dateS: string) {
    let m = +dateS.substring(4, 6)
    let d = +dateS.substring(6, 8)
    return `${d}.${m}.`
}

function formatTime(time: string) {
    let [hours, minutes] = time.split(":").map(t => +t)
    let h = hours < 10 ? `0${hours}` : `${hours}`
    let m = minutes < 10 ? `0${minutes}` : `${minutes}`
    return `${h}:${m}`
}
