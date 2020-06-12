import { Polygon, Feature, FeatureCollection } from "geojson"
import { LngLatBoundsLike } from "mapbox-gl"

import regionData from '../data/region_data.json';
import { Region, GiftSlot } from "../types";

export function getRegionGeoJSON(): Region[] {
    let data = regionData as FeatureCollection;
    return data.features.map(region => ({
        name: region.properties.nimi_fi,
        feature: region,
        bounds: getRegionBounds(region)
    }));
}

export function getRandomLocations(giftSlots: GiftSlot[]): [number, number][] {
    let regionData = getRegionGeoJSON();
    return giftSlots.map(slot => {
        let region = regionData.find(r => r.feature.properties.nimi_fi === slot.region);
        for (let i = 0; i < 10; i++) {
            let lng = region.bounds[0][0] + Math.random() * (region.bounds[1][0] - region.bounds[0][0]);
            let lat = region.bounds[0][1] + Math.random() * (region.bounds[1][1] - region.bounds[0][1]);
            return [lng, lat];
        }
    })
}

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