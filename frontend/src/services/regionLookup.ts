import { Polygon, Feature, FeatureCollection } from "geojson"
import { LngLatBoundsLike } from "mapbox-gl"
import intersect from '@turf/intersect';
import bbox from '@turf/bbox';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import { memoize } from 'lodash';
import regionData from '../data/region_data.json';
import visRegionLimit from '../data/point_visualisation_region_limit.json';

import { Region, GiftSlot } from "../types";

export function getRegionGeoJSON(): Region[] {
    let data = regionData as FeatureCollection;
    return data.features.map(region => ({
        name: region.properties.nimi_fi,
        feature: region,
        bounds: getRegionBounds(region)
    }));
}

export let getRandomLocationsForVisualisation = memoize((giftSlots: GiftSlot[]): { id: string, location: [number, number] }[] => {
    let regionData = getRegionGeoJSON().map(region => {
        let limitedGeometry = intersect(region.feature.geometry as any, visRegionLimit.features[0].geometry as any);
        let limitedBbox = bbox(limitedGeometry);
        return ({ ...region, limitedGeometry, limitedBbox })
    });


    let res: { id: string, location: [number, number] }[] = [];
    for (let slot of giftSlots) {
        let region = regionData.find(r => r.feature.properties.nimi_fi === slot.region);
        for (let i = 0; i < 10; i++) {
            let lng = region.limitedBbox[0] + Math.random() * (region.limitedBbox[2] - region.limitedBbox[0]);
            let lat = region.limitedBbox[1] + Math.random() * (region.limitedBbox[3] - region.limitedBbox[1]);
            let pt = [lng, lat];
            if (pointInPolygon(pt, region.limitedGeometry)) {
                res.push({ id: slot.id, location: [lng, lat] });
                break;
            }
        }
    }
    return res;
}, (slots: GiftSlot[]) => slots.map(s => s.id).join('-'))

function getRegionBounds(region: Feature): LngLatBoundsLike {
    let poly = region.geometry as Polygon
    return poly.coordinates.reduce(
        (bounds, coords) =>
            coords.reduce(
                (bounds, coord) => [
                    [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
                    [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
                ],
                bounds
            ),
        poly.coordinates[0] as [[number, number], [number, number]]
    ) as LngLatBoundsLike
}