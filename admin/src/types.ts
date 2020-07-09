
export type Slot = {
    id?: string;
    date: string;
    time: string;
    region: string;
    status: "available" | "reserved" | "onHold";
};

export type Gift = {
    id: string;
    slotId: string;
    status: 'creating' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';
    toName: string;
    toAddress: string;
    toLocation?: GiftLocation;
    toLanguage: string;
    toSignificance: string;
    fromName: string;
    fromPhoneNumber: string;
    fromEmail: string;
    fromMessage: string;
};
export type GiftLocation = {
    region: string;
    point: [number, number];
};