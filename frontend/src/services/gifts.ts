import firebase from 'gatsby-plugin-firebase';
import { GiftSlot, Gift } from '../types';

export function subscribeToGiftSlotsOverview(callback: (slots: GiftSlot[]) => void) {
    let unSub = firebase.firestore().collection("slots").orderBy("date")
        .orderBy("time")
        .orderBy("region")
        .onSnapshot((slotsSnapshot) => {
            callback(
                slotsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GiftSlot))
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
                byDate[slotData.date].push({ id: slot.id, ...slotData });
            }
            callback(byDate);
        });
    return unSub

}

export function getGiftSlot(id: string): Promise<GiftSlot> {
    return firebase.firestore().collection("slots")
        .doc(id)
        .get()
        .then(d => ({ id: d.id, ...d.data() } as GiftSlot))
}

export function reserveGift(gift: Gift) {
    return firebase.firestore().collection("gifts")
        .add(gift)
        .then(d => d.get())
        .then(d => ({ id: d.id, ...d.data() } as Gift));
}

export function subscribeToGiftWithSlot(id: string, callback: ({ gift: Gift, slot: GiftSlot }) => void) {
    return firebase.firestore().collection("gifts")
        .doc(id)
        .onSnapshot(async (d) => callback({
            gift: { id: d.id, ...d.data() } as Gift,
            slot: await getGiftSlot(d.data().slotId)
        }))
}