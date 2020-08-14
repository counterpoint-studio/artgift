import { FeatureCollection } from "geojson"
import { LngLatBoundsLike } from 'mapbox-gl';
import bbox from '@turf/bbox';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import { memoize } from 'lodash';

import regionData from '../data/region_data.json';
import { Region, GiftSlot } from "../types";
import { REGION_NAME_PROPERTY } from '../constants';

export function getRegionGeoJSON(): Region[] {
    let data = regionData as FeatureCollection;
    return data.features.map(region => ({
        name: region.properties[REGION_NAME_PROPERTY],
        feature: region,
        bounds: bbox(region) as any
    }));
}

let randomLocCache = new Map<string, { id: string, location: [number, number] }>();
export let getRandomLocationsForVisualisation = (giftSlots: GiftSlot[]): { id: string, location: [number, number] }[] => {
    let regionData = getRegionGeoJSON().map(region => {
        return ({ ...region, bbox: bbox(region.feature.geometry) })
    });

    let res: { id: string, location: [number, number] }[] = [];
    for (let slot of giftSlots) {
        if (randomLocCache.has(slot.id)) {
            res.push(randomLocCache.get(slot.id));
        } else {
            let region = regionData.find(r => r.feature.properties[REGION_NAME_PROPERTY] === slot.region);
            for (let i = 0; i < 10; i++) {
                let lng = region.bbox[0] + Math.random() * (region.bbox[2] - region.bbox[0]);
                let lat = region.bbox[1] + Math.random() * (region.bbox[3] - region.bbox[1]);
                let pt = [lng, lat];
                if (pointInPolygon(pt, region.feature.geometry as any)) {
                    let loc = { id: slot.id, location: [lng, lat] as [number, number] };
                    res.push(loc);
                    randomLocCache.set(slot.id, loc);
                    break;
                }
            }
        }
    }
    return res;
}

export let getWholeRegionBounds = memoize(() => {
    return bbox(regionData) as LngLatBoundsLike
});