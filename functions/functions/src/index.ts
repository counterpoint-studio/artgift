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
