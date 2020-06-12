import firebase from 'gatsby-plugin-firebase';
import { GiftSlot } from '../types';

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

export function subscribeToGiftSlotsInRegion(region: string, callback: (slots: GiftSlot[]) => void) {
    let unSub = firebase.firestore().collection("slots").where('region', '==', region).orderBy("date")
        .orderBy("time")
        .onSnapshot((slotsSnapshot) => {
            callback(
                slotsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GiftSlot))
            );
        });
    return unSub

}
