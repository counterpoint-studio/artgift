import { Gift } from "./types";

export const MAPBOX_COUNTRY_CODE = 'FI';
export const MAPBOX_LANGUAGE_CODE = 'fi';
export const MAPBOX_REGION_PLACE_NAME = 'Helsinki';

export const MAP_INIT_CENTER: [number, number] = [25.03, 60.192059];
export const REGION_BOUNDING_BOX: [[number, number], [number, number]] = [[24.810103, 60.140056], [25.264933, 60.299425]]

// Finnish mobile number in national or international format
// "Regional" codes based on https://www.traficom.fi/fi/viestinta/laajakaista-ja-puhelin/matkaviestinverkkojen-suuntanumerot
export const PHONE_NUMBER_REGEX = /\+?(358|0)(40|41|42|4320|4321|4322|4322|4324|4325|436|438|44|450|451|452|453|4540|4541|4542|4543|4544|4545|4546|4547|4548|4549|4550|4551|4552|4554|4555|4556|4557|4558|4559|456|4570|4571|4572|4573|4574|4575|4576|4577|4578|4579|458|46|4941|4942|4944|50)\d{4,9}/;

export const INIT_GIFT: Gift = {
    status: "pending",
    toName: "",
    toAddress: "",
    toLanguage: "fi",
    toSignificance: "",
    fromName: "",
    fromPhoneNumber: "",
    fromEmail: "",
    fromMessage: ""
}
