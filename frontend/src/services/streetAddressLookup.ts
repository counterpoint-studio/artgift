import { geocodingService } from "./mapbox";
import { MAPBOX_COUNTRY_CODE, MAPBOX_LANGUAGE_CODE } from "../constants";

export async function findAddresses(query: string) {
    let res = await geocodingService.forwardGeocode({
        query,
        countries: [MAPBOX_COUNTRY_CODE],
        types: ['address'],
        autocomplete: true,
        language: [MAPBOX_LANGUAGE_CODE]
    }).send()
    return res.body;
}