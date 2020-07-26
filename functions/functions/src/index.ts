import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Handlebars from 'handlebars';
import fetch from 'node-fetch';
import mandrill from 'mandrill-api';
import { URLSearchParams } from 'url';
import { sortBy, last, pick, isEqual } from 'lodash';

import { RESERVATION_PERIOD, REMINDER_PERIOD, TIME_ZONE_UTC_OFFSET, DEFAULT_LANGUAGE, NOOP_PHONE_NUMBER } from './constants';


admin.initializeApp();

let db = admin.firestore();

let messageTemplates: { [locale: string]: { [key: string]: Handlebars.TemplateDelegate } } | null = null;
function getMessageTemplates() {
    if (!messageTemplates) {
        let messageTemplateSources = require('./messages.json');
        messageTemplates = {};
        for (let locale of Object.keys(messageTemplateSources)) {
            messageTemplates[locale] = {};
            for (let msg of Object.keys(messageTemplateSources[locale])) {
                messageTemplates[locale][msg] = Handlebars.compile(messageTemplateSources[locale][msg]);
            }
        }
    }
    return messageTemplates;
}

export const makeSlotsAvailableBasedOnAppState = functions.region('europe-west1')
    .firestore
    .document("appstates/{appStateId}")
    .onWrite(async change => {
        if (!change.after.exists) return;
        let appState = change.after.data()!.state;
        if (appState === 'open') {
            let slotsToUpdate = await db.collection('slots').where('status', '==', 'notAvailable').get();
            let batch = db.batch();
            slotsToUpdate.forEach(slot => {
                batch.set(slot.ref, { status: 'available' }, { merge: true });
            })
            await batch.commit();
        } else if (appState === 'closed') {
            let slotsToUpdate = await db.collection('slots').where('status', '==', 'available').get();
            let batch = db.batch();
            slotsToUpdate.forEach(slot => {
                batch.set(slot.ref, { status: 'notAvailable' }, { merge: true });
            })
            await batch.commit();
        }
    });


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

            let prevSlotRef = prevGift.exists && prevGift.data()!.slotId ? db.collection('slots').doc(prevGift.data()!.slotId) : undefined;
            let prevSlot = prevSlotRef && await tx.get(prevSlotRef);
            // Slot is available if its status is available or if it was already reserved for this gift.
            let slotAvailable = slot.exists && (slot.data()!.status === 'available' || prevSlot?.id === slotId);
            if (slotAvailable) {
                await tx.set(giftRef, {
                    slotId,
                    processedReservationId: document.id,
                    reservedUntil: Date.now() + RESERVATION_PERIOD
                }, { merge: true });
                // Set previous slot as available again.
                if (prevSlot) {
                    await tx.set(prevSlotRef!, { status: 'available' }, { merge: true });
                }
                // Set slot as reserved.
                await tx.set(slotRef, { status: 'reserved' }, { merge: true });
            } else {
                await tx.set(giftRef, { processedReservationId: document.id }, { merge: true });
            }
        });

    });

export const expireUnfinishedGifts = functions
    .region('europe-west1')
    .pubsub
    .schedule('every 1 minutes')
    .onRun(expireUnfinished);

export async function expireUnfinished() {
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
}

export const releaseSlotOnGiftDelete = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onDelete(async (snap) => {
        let statusBefore = snap.data()!.status;
        if (statusBefore && (statusBefore === 'creating' || statusBefore === 'pending' || statusBefore === 'confirmed') &&
            snap.data().slotId) {
            let slotRef = db.collection('slots').doc(snap.data().slotId);
            await slotRef.set({ status: 'available' }, { merge: true });
        }
    });

export const releaseSlotOnGiftRejection = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onUpdate(async (change) => {
        let statusBefore = change.before.exists && change.before.data()!.status;
        let statusAfter = change.after.exists && change.after.data()!.status;
        if (statusBefore && (statusBefore === 'creating' || statusBefore === 'pending' || statusBefore === 'confirmed') &&
            statusAfter && (statusAfter === 'rejected' || statusAfter === 'cancelled') &&
            change.after.data().slotId) {
            let slotRef = db.collection('slots').doc(change.after.data().slotId);
            await slotRef.set({ status: 'available' }, { merge: true });
        }
    });

export const createGiftMessage = functions
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

export const createGiftReminderMessages = functions.region('europe-west1').pubsub.schedule('every 1 hours').onRun(async () => {
    let confirmedGifts = await db.collection('gifts').where('status', '==', 'confirmed').get();
    confirmedGifts.forEach(async (gift) => {
        let giftData = gift.data();
        let { date, time } = await (await db.collection('slots').doc(giftData.slotId).get()).data()!;
        let giftDate = parseDateTime(date, time);
        let giftTimestamp = giftDate.getTime() - TIME_ZONE_UTC_OFFSET * 60 * 60 * 1000;
        if (giftTimestamp - Date.now() < REMINDER_PERIOD) {
            let giftMessages = await db.collection('messages').where('giftId', '==', gift.id).get();
            let existingReminder = giftMessages.docs.find(d => d.data().messageKey === 'giftReminder');
            if (!existingReminder) {
                let template = getMessageTemplates()[giftData.fromLanguage || 'en'].giftReminderBody;
                let baseUrl = functions.config().artgift.baseurl;
                let message = template({
                    dateTime: `${formatDate(date)} ${formatTime(time)}`,
                    address: giftData.toAddress,
                    url: new Handlebars.SafeString(`${baseUrl}/gift?id=${gift.id}`)
                });
                db.collection('messages').add({
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

export const populateArtistItinerariesOnArtistUpdate = functions
    .region('europe-west1')
    .firestore
    .document("artists/{artistId}")
    .onWrite(async (change) => {
        let affectedRegions = new Set<string>();
        let itinerariesBefore = change.before.exists ?
            sortBy(change.before.data()!.itineraries.map((it: any) => pick(it, 'region', 'from', 'to')), it => it.from.date, it => it.from.time) :
            [];
        let itinerariesAfter = change.after.exists ?
            sortBy(change.after.data()!.itineraries.map((it: any) => pick(it, 'region', 'from', 'to')), it => it.from.date, it => it.from.time) :
            [];
        if (!isEqual(itinerariesBefore, itinerariesAfter)) {
            if (change.before.exists) {
                for (let itinerary of change.before.data()!.itineraries) {
                    affectedRegions.add(itinerary.region);
                }
            }
            if (change.after.exists) {
                for (let itinerary of change.after.data()!.itineraries) {
                    affectedRegions.add(itinerary.region);
                }
            }
        }
        console.log('on artist update, populating itineraries for regions', Array.from(affectedRegions));
        for (let region of Array.from(affectedRegions)) {
            await db.runTransaction(tx => populateArtistItineraries(region, tx));
        }
    });

export const sendArtistInvitation = functions
    .region('europe-west1')
    .firestore
    .document("artists/{artistId}")
    .onUpdate(async ({ before, after }) => {
        let beforeInvitationTrigger = before.exists && before.data()!.invitationTrigger;
        let afterInvitationTrigger = after.exists && after.data()!.invitationTrigger;
        if (afterInvitationTrigger && afterInvitationTrigger !== beforeInvitationTrigger) {
            let messageRef = db.collection('messages').doc(after.id);
            let phoneNumber = after.data().phoneNumber;
            let email = after.data().email;
            let name = after.data().name;
            if (phoneNumber || email) {
                let emailSubject = getMessageTemplates()[DEFAULT_LANGUAGE].artistCreatedSubject({});
                let bodyTemplate = getMessageTemplates()[DEFAULT_LANGUAGE].artistCreatedBody;
                let baseUrl = functions.config().artgift.baseurl;
                let url = `${baseUrl}/artist?id=${after.id}`;
                let smsBody = bodyTemplate({
                    url: new Handlebars.SafeString(url)
                });
                let emailBody = bodyTemplate({
                    url: new Handlebars.SafeString(`<a href="${url}">${url}</a>`)
                });
                messageRef.set({
                    emailSubject,
                    emailBody,
                    smsBody,
                    toNumber: phoneNumber,
                    toEmail: email,
                    toName: name,
                    messageKey: 'artistCreated',
                    sent: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                })
            }
        }
    });

export const populateArtistItinerariesOnSlotUpdate = functions
    .region('europe-west1')
    .firestore
    .document("slots/{slotId}")
    .onWrite(async (change) => {
        let affectedRegions = new Set<string>();
        if (change.before.exists) {
            affectedRegions.add(change.before.data()!.region);
            if (change.after.exists) {
                affectedRegions.add(change.after.data()!.region);
            }
        }
        console.log('on slot update, populating itineraries for regions', Array.from(affectedRegions));
        for (let region of Array.from(affectedRegions)) {
            await db.runTransaction(tx => populateArtistItineraries(region, tx));
        }
    });


function parseDateTime(date: any, time: any) {
    return new Date(
        +date.substring(0, 4),
        +(date.substring(4, 6)) - 1,
        +date.substring(6, 8),
        +time.substring(0, 2),
        +time.substring(3, 5)
    );
}

async function populateArtistItineraries(region: string, tx: FirebaseFirestore.Transaction) {
    let artists = await db.collection('artists').get()
    let affectedArtistRefs: admin.firestore.DocumentReference[] = [];
    artists.forEach(artist => {
        if (artist.data().itineraries.find((i: any) => i.region === region)) {
            affectedArtistRefs.push(artist.ref);
        }
    });

    let slots = await db.collection('slots')
        .where('region', '==', region)
        .where('status', '==', 'reserved')
        .get();
    let affectedSlotRefs: admin.firestore.DocumentReference[] = [];
    slots.forEach(slot => affectedSlotRefs.push(slot.ref));

    let gifts = affectedSlotRefs.length > 0 ? await db.collection('gifts')
        .where('slotId', 'in', affectedSlotRefs.map(r => r.id))
        .get() :
        [];
    let affectedGiftRefs: admin.firestore.DocumentReference[] = [];
    gifts.forEach(gift => {
        if (gift.data().status !== 'rejected' && gift.data().status !== 'cancelled') {
            affectedGiftRefs.push(gift.ref);
        }
    });

    let affectedArtists = affectedArtistRefs.length > 0 ? await tx.getAll(...affectedArtistRefs) : [];
    let affectedSlots = affectedSlotRefs.length > 0 ? await tx.getAll(...affectedSlotRefs) : [];
    let affectedGifts = affectedGiftRefs.length > 0 ? await tx.getAll(...affectedGiftRefs) : [];

    console.log('populating', affectedGifts.length, 'gifts amongst', affectedArtists.length, 'artists in ', region);

    let slotsInTimeOrder = sortBy(
        affectedSlots
            .filter(slot => !!affectedGifts.find(g => (g.data() as any).slotId === slot.id))
            .map(slot => ({ id: slot.id, data: slot.data() as any })),
        s => s.data.date,
        s => s.data.time
    );
    let artistData = affectedArtists.map(a => ({
        ref: a.ref,
        data: {
            ...a.data() as any,
            itineraries: sortBy(
                (a.data() as any).itineraries.map((i: any) => ({
                    ...i,
                    assignments: i.region === region ? [] : i.assignments // clear existing assignments for this region
                })),
                i => i.from.date,
                i => i.from.time
            )
        }
    }));

    for (let slot of slotsInTimeOrder) {
        let slotDate = parseDateTime(slot.data.date, slot.data.time);
        let gift = affectedGifts.find(g => (g.data() as any).slotId === slot.id)!;
        console.log('slot', slot.id, 'gift', gift.id, 'at', slotDate);
        let bestArtistIdx = -1, bestItineraryIdx = -1, bestItineraryGapSincePrevious = 0;
        for (let i = 0; i < artistData.length; i++) {
            for (let j = 0; j < artistData[i].data.itineraries.length; j++) {
                let it = artistData[i].data.itineraries[j];
                if (it.region !== region) {
                    continue;
                }
                let itFrom = parseDateTime(it.from.date, it.from.time);
                let itTo = parseDateTime(it.to.date, it.to.time);
                if (slotDate.getTime() >= itFrom.getTime() && slotDate.getTime() < itTo.getTime()) {
                    console.log('matching artist itinerary', artistData[i].data, j);
                    let lastSlotId = getLastAssignedSlotId(artistData[i].data);
                    let lastSlot = lastSlotId ? slotsInTimeOrder.find(s => s.id === lastSlotId)?.data : null;
                    let gapSinceLastSlot = lastSlot ? slotDate.getTime() - parseDateTime(lastSlot.date, lastSlot.time).getTime() : Number.MAX_VALUE;
                    console.log('gap since last', gapSinceLastSlot);
                    if (gapSinceLastSlot > bestItineraryGapSincePrevious) {
                        console.log('is best so far');
                        bestArtistIdx = i;
                        bestItineraryIdx = j;
                        bestItineraryGapSincePrevious = gapSinceLastSlot;
                    }
                }
            }
        }
        if (bestArtistIdx >= 0 && bestItineraryIdx >= 0) {
            artistData[bestArtistIdx].data.itineraries[bestItineraryIdx].assignments.push({ slotId: slot.id, giftId: gift.id });
        }
    }

    for (let a of artistData) {
        console.log('artist update', a.ref.id);
        await tx.set(a.ref, a.data);
    }
}

function getLastAssignedSlotId(artistData: any) {
    for (let i = artistData.itineraries.length - 1; i >= 0; i--) {
        if (artistData.itineraries[i].assignments.length > 0) {
            return (last(artistData.itineraries[i].assignments) as any).slotId;
        }
    }
    return null;
}

async function createMessage(giftId: string, giftDocument: FirebaseFirestore.DocumentData, messageKey: string, eventId: string) {
    let messageRef = db.collection('messages').doc(eventId);
    if (await shouldCreate(messageRef)) {
        let slot = await (await db.collection('slots').doc(giftDocument.slotId).get()).data();
        let bodyTemplate = getMessageTemplates()[giftDocument.fromLanguage || 'en'][messageKey + 'Body'];
        let emailSubject = getMessageTemplates()[giftDocument.fromLanguage || 'en'][messageKey + 'Subject']({})
        let baseUrl = functions.config().artgift.baseurl;
        let url = `${baseUrl}/gift?id=${giftId}`;
        let smsBody = bodyTemplate({
            dateTime: `${formatDate(slot!.date)} ${formatTime(slot!.time)}`,
            address: giftDocument.toAddress,
            url: new Handlebars.SafeString(url)
        });
        let emailBody = bodyTemplate({
            dateTime: `${formatDate(slot!.date)} ${formatTime(slot!.time)}`,
            address: giftDocument.toAddress,
            url: new Handlebars.SafeString(`<a href="${url}">${url}</a>`)
        });
        messageRef.set({
            emailSubject,
            emailBody,
            smsBody,
            toNumber: giftDocument.fromPhoneNumber,
            toEmail: giftDocument.fromEmail,
            toName: giftDocument.fromName,
            giftId,
            messageKey,
            sent: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    }
}

function shouldCreate(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.get().then(messageDoc => {
        return !messageDoc.exists;
    });
}

export const sendMessages = functions.region('europe-west1').pubsub.schedule('every 2 minutes').onRun(async () => {
    let testMode = functions.config().artgift.testmode;
    if (testMode) {
        console.log('In test mode; skipping message sending');
    }
    let unsentMessages = await db.collection('messages').where('sent', '==', false).get();
    unsentMessages.forEach(async doc => {
        let { emailSubject, emailBody, smsBody, toNumber, toEmail, toName, createdAt } = doc.data()!;
        if (createdAt.toMillis() < Date.now() - 2 * 60 * 1000) {
            let smsSend = toNumber && toNumber !== NOOP_PHONE_NUMBER ? sendSMS(smsBody, toNumber) : Promise.resolve();
            let emailSend = toEmail ? sendEmail(emailSubject, emailBody, toEmail, toName) : Promise.resolve();
            await Promise.all([smsSend, emailSend]);
            doc.ref.set({ sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
    });
});

function sendSMS(message: string, toNumber: string) {
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

function sendEmail(subject: string, body: string, toEmail: string, toName: string) {
    let cfg = functions.config();
    let fromEmail = cfg.artgift.emailapi.fromaddress;
    let fromName = cfg.artgift.emailapi.fromname;
    let mandrillClient = new mandrill.Mandrill(functions.config().artgift.emailapi.apikey);
    return new Promise((res) => mandrillClient.messages.send({
        message: {
            subject,
            html: body,
            from_email: fromEmail,
            from_name: fromName,
            to: [{
                email: toEmail,
                name: toName,
                type: 'to'
            }],
            auto_text: true
        }
    }, result => {
        console.log('Email API response', result, 'for request', {
            message: {
                subject,
                html: body,
                from_email: fromEmail,
                from_name: fromName,
                to: [{
                    email: toEmail,
                    name: toName,
                    type: 'to'
                }],
                auto_text: true
            }
        });
        res();
    }));
}

function normalisePhoneNumber(number: string) {
    number = number.replace(/\s+/g, '');
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
