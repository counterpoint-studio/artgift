import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Handlebars from 'handlebars';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const RESERVATION_PERIOD = 15 * 60 * 1000;

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

export const sendGiftSMS = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onWrite(async (change, context) => {
        let document = change.after.exists ? change.after.data() : null;
        let previousDocument = change.before.exists ? change.before.data() : null;
        let eventId = context.eventId;
        let messageRef = db.collection('sentMessages').doc(eventId);
        if (document && previousDocument && document.status === 'pending' && previousDocument.status === 'creating') {
            // New gift, send message
            if (await shouldSend(messageRef)) {
                let slot = await (await db.collection('slots').doc(document.slotId).get()).data();
                let template = smsTemplates[document.fromLanguage || 'en'].giftCreated;
                let baseUrl = functions.config().artgift.baseurl;
                let message = template({
                    date: `${formatDate(slot!.date)} ${formatTime(slot!.time)}`,
                    address: document.toAddress,
                    url: new Handlebars.SafeString(`${baseUrl}/gift?id=${change.after.id}`)
                });
                await sendMessage(message, document.fromPhoneNumber);
                await markSent(messageRef);
            }
        } else if (document) {
            // Update messages
        }
        return Promise.resolve()
    });

function shouldSend(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.get().then(smsDoc => {
        return !smsDoc.exists || !smsDoc.data()!.sent;
    });
}

function markSent(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.set({ sent: true });
}

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
