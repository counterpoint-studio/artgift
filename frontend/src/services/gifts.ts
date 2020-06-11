import firebase from 'gatsby-plugin-firebase';

export type GiftSlot = {
    id: string;
    region: string;
    date: string;
    time: string;
    status: 'available' | 'reserved' | 'onHold'
}

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
