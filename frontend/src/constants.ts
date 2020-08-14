export const MAPBOX_COUNTRY_CODE = 'US';
export const MAPBOX_REGION_PLACE_NAME = 'Boston';

export const REGION_NAME_PROPERTY = 'Name';

// Finnish mobile number in national or international format
// "Regional" codes based on https://www.traficom.fi/fi/viestinta/laajakaista-ja-puhelin/matkaviestinverkkojen-suuntanumerot
export const PHONE_NUMBER_REGEX = /\+?(358|0)(40|41|42|4320|4321|4322|4322|4324|4325|436|438|44|450|451|452|453|4540|4541|4542|4543|4544|4545|4546|4547|4548|4549|4550|4551|4552|4554|4555|4556|4557|4558|4559|456|4570|4571|4572|4573|4574|4575|4576|4577|4578|4579|458|46|4941|4942|4944|50)\d{4,9}/;

// A prefix to put in front of phone numbers to make a phone call and obscure your number. Used in the artist UI
// so they can call gift gives whilst preserving their privacy. If not supported in you country, make blank.
export const PHONE_NUMBER_PRIVACY_PREFIX = '#31#';

// To test whether a street address string contains the necessary street number
export const ADDRESS_STREET_NUMBER_MATCH = /\d/;

// To extract from a street address the part that is needed to geocode it with the Mapbox API
export const ADDRESS_GEOCODING_PREFIX = /.*?\d+/;