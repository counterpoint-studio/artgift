import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Handlebars from 'handlebars';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

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

export const updateSlotReservedStatus = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onWrite((change) => {
        let document = change.after.exists ? change.after.data() : null;
        let previousDocument = change.before.exists ? change.before.data() : null;
        if (document) {
            let slotDoc = db.collection("slots").doc(document.slotId);
            return slotDoc.set({ status: "reserved" }, { merge: true });
        } else if (previousDocument) {
            let slotDoc = db.collection("slots").doc(previousDocument.slotId);
            return slotDoc.set({ status: "available" }, { merge: true });
        } else {
            return Promise.resolve();
        }
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
