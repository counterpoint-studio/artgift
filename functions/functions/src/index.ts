import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

let db = admin.firestore();

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

export const ensureGiftPendingStatusWhenCreated = functions
    .region('europe-west1')
    .firestore
    .document("gifts/{giftId}")
    .onCreate((snap) => {
        return snap.ref.set({ status: 'pending' }, { merge: true })
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
        if (!previousDocument) {
            // New gift, send message
            if (await shouldSend(messageRef)) {

            }
        } else if (document) {
            // Update messages
        }
        return Promise.resolve()
    });

function shouldSend(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.get().then(emailDoc => {
        return !emailDoc.exists || !emailDoc.data()!.sent;
    });
}

function markSent(messageRef: FirebaseFirestore.DocumentReference) {
    return messageRef.set({ sent: true });
}