import firebase from 'gatsby-plugin-firebase';
import { nanoid } from 'nanoid';

import { GiftSlot, Gift } from '../types';

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
        fromLanguage
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


export function saveGift(gift: Gift) {
    return firebase.firestore().collection("gifts")
        .doc(gift.id)
        .set(gift)
        .then(() => getGift(gift.id));
}


export function getGift(id: string): Promise<Gift> {
    return firebase.firestore().collection("gifts")
        .doc(id)
        .get()
        .then(d => ({ ...d.data(), id: d.id } as Gift))
}

export function subscribeToGiftWithSlot(id: string, callback: ({ gift: Gift, slot: GiftSlot }) => void) {
    return firebase.firestore().collection("gifts")
        .doc(id)
        .onSnapshot(async (d) => callback({
            gift: { ...d.data(), id: d.id } as Gift,
            slot: await getGiftSlot(d.data().slotId)
        }))
}