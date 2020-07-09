import { Feature } from "geojson"
import { LngLatBoundsLike } from "mapbox-gl"

export type GiftSlot = {
    id: string;
    region: string;
    date: string;
    time: string;
    status: 'available' | 'reserved' | 'onHold'
}

export type Gift = {
    id: string;
    slotId?: string;
    status: 'creating' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';
    reservedUntil?: number;
    toName: string;
    toAddress: string;
    toLocation?: GiftLocation;
    toLanguage: string;
    toSignificance: string;
    fromName: string;
    fromPhoneNumber: string;
    fromEmail: string;
    fromMessage: string;
    fromLanguage: string;
}

export type GiftLocation = {
    region: string;
    point: [number, number];
}

export type Region = {
    name: string;
    feature: Feature;
    bounds: LngLatBoundsLike;
};
