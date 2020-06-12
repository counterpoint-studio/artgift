import { geocodingService } from "./mapbox";
import { MAPBOX_COUNTRY_CODE, MAPBOX_LANGUAGE_CODE, REGION_BOUNDING_BOX, MAPBOX_REGION_PLACE_NAME } from "../constants";

export async function findAddresses(query: string) {
    let res = await geocodingService.forwardGeocode({
        query,
        countries: [MAPBOX_COUNTRY_CODE],
        types: ['address'],
        autocomplete: true,
        bbox: [...REGION_BOUNDING_BOX[0], ...REGION_BOUNDING_BOX[1]],
        language: [MAPBOX_LANGUAGE_CODE],
        limit: 10
    }).send()
    return res.body.features.filter(isInRegion).map(f => f.text);
}

function isInRegion(feature: any) {
    let placeName = feature.context.find(ctx => ctx.id.startsWith('place'));
    return placeName.text === MAPBOX_REGION_PLACE_NAME;
}