import firebase from 'gatsby-plugin-firebase';
import { nanoid } from 'nanoid';

import { GiftSlot, Gift, Artist } from '../types';

export function initGift(fromLanguage = 'fi'): Gift {
    return {
        id: nanoid(),
        status: "creating",
        toName: "",
        toAddress: "",
        toLanguage: "fi",
        toSignificance: "",
        fromName: "",
        fromPhoneNumber: "",
        fromEmail: "",
        fromMessage: "",
        fromLanguage,
        fromPhotographyPermissionGiven: false
    }
};

export function subscribeToGiftSlotsOverview(callback: (slots: GiftSlot[]) => void) {
    let unSub = firebase.firestore().collection("slots").orderBy("date")
        .orderBy("time")
        .orderBy("region")
        .onSnapshot((slotsSnapshot) => {
            callback(
                slotsSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as GiftSlot))
            );
        });
    return unSub

}

export function getGiftSlotsInRegion(region: string): Promise<GiftSlot[]> {
    return firebase.firestore()
        .collection("slots")
        .where('region', '==', region)
        .orderBy("date")
        .orderBy("time")
        .get()
        .then(res => res.docs.map(doc => ({ ...doc.data(), id: doc.id } as GiftSlot)));
}

export function subscribeToGiftSlotsInRegion(region: string, callback: (slots: { [day: string]: GiftSlot[] }) => void) {
    let unSub = firebase.firestore().collection("slots").where('region', '==', region).orderBy("date")
        .orderBy("time")
        .onSnapshot((slotsSnapshot) => {
            let byDate = {};
            for (let slot of slotsSnapshot.docs) {
                let slotData = slot.data() as GiftSlot
                if (!byDate[slotData.date]) {
                    byDate[slotData.date] = []
                }
                byDate[slotData.date].push({ ...slotData, id: slot.id });
            }
            callback(byDate);
        });
    return unSub

}

export function getGiftSlot(id: string): Promise<GiftSlot> {
    return firebase.firestore().collection("slots")
        .doc(id)
        .get()
        .then(d => ({ ...d.data(), id: d.id } as GiftSlot))
}

export async function reserveSlot(gift: Gift, slotId: string): Promise<Gift> {
    let db = firebase.firestore();
    let giftRef = db.collection('gifts').doc(gift.id);
    let reservationId = nanoid();
    db.collection('reservations').doc(reservationId).set({ giftId: gift.id, slotId: slotId });
    let giftWithReservation = await new Promise<Gift>(res => {
        let unSub = giftRef.onSnapshot(g => {
            if (g.exists && g.data().processedReservationId === reservationId) {
                unSub();
                res({ ...g.data() as Gift, id: gift.id });
            }
        })
    });
    return giftWithReservation;
}

export async function saveGift(gift: Gift) {
    let db = firebase.firestore();
    let giftRef = db.collection('gifts').doc(gift.id);
    await giftRef.set(gift, { merge: true });
    return getGift(gift.id);
}


export function getGift(id: string): Promise<Gift> {
    return firebase.firestore().collection("gifts")
        .doc(id)
        .get()
        .then(d => ({ ...d.data(), id: d.id } as Gift))
}

export function subscribeToGiftWithSlot(id: string, callback: (giftAndSlot?: { gift: Gift, slot: GiftSlot }) => void) {
    return firebase.firestore().collection("gifts")
        .doc(id)
        .onSnapshot(async (d) => d.exists ? callback({
            gift: { ...d.data(), id: d.id } as Gift,
            slot: await getGiftSlot(d.data().slotId)
        }) : callback())
}

export function subscribeToArtist(id: string, callback: (artist: Artist) => void) {
    return firebase.firestore().collection("artists")
        .doc(id)
        .onSnapshot(async (d) => callback({ ...d.data(), id: d.id } as Artist))
}
