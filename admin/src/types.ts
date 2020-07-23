
export type Slot = {
    id?: string;
    date: string;
    time: string;
    region: string;
    status: "notAvailable" | "available" | "reserved";
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
    cancellationReason?: string;
};
export type GiftLocation = {
    region: string;
    point: [number, number];
};

export type Artist = {
    id?: string;
    name: string;
    phoneNumber: string;
    email: string;
    itineraries: ArtistItinerary[]
}

export type ArtistItinerary = {
    region: string;
    from: { date: string, time: string };
    to: { date: string, time: string };
    assignments: { slotId: string, giftId: string }[];
}