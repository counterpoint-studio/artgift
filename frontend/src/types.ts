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
    id?: string;
    slotId?: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
    toName: string;
    toAddress: string;
    toLocation?: GiftLocation;
    toLanguage: string;
    toSignificance: string;
    fromName: string;
    fromPhoneNumber: string;
    fromEmail: string;
    fromMessage: string;
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
