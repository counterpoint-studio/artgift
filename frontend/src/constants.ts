import { Gift } from "./types";

export const MAPBOX_COUNTRY_CODE = 'FI';
export const MAPBOX_LANGUAGE_CODE = 'fi';
export const MAPBOX_REGION_PLACE_NAME = 'Helsinki';

export const MAP_INIT_CENTER: [number, number] = [25.03, 60.192059];
export const REGION_BOUNDING_BOX: [[number, number], [number, number]] = [[24.810103, 60.140056], [25.264933, 60.299425]]

export const INIT_GIFT: Gift = {
    toName: "",
    toAddress: "",
    toLanguage: "",
    toSignificance: "",
    fromName: "",
    fromPhoneNumber: "",
    fromEmail: "",
    fromMessage: ""
}
