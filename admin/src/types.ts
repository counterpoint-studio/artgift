import { Feature } from "geojson"

export type AppState = 'pre' | 'open' | 'paused' | 'post';

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
    reservedAt?: { seconds: number };
    toName: string;
    toAddress: string;
    toLocation?: GiftLocation;
    toLanguage: string;
    toSignificance: string;
    fromName: string;
    fromPhoneNumber: string;
    fromEmail: string;
    fromMessage: string;
    fromPhotographyPermissionGiven: boolean;
    cancellationReason?: string;
};
export type GiftLocation = {
    region: string;
    point: [number, number];
};

export type Artist = {
    id?: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    invitationTrigger?: number;
    itineraries: ArtistItinerary[]
}

export type ArtistItinerary = {
    region: string;
    from: { date: string, time: string };
    to: { date: string, time: string };
    assignments: { slotId: string, giftId: string }[];
}

export type Region = {
    name: string;
    feature: Feature;
};