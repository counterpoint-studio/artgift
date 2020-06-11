import { Polygon, Feature, FeatureCollection } from "geojson"
import mapboxgl from "mapbox-gl"

import regionData from '../data/region_data.json';
import { GiftSlot } from './gifts';

export type Region = {
    feature: Feature
    bounds: mapboxgl.LngLatBounds
};

export function getRegionGeoJSON(): Region[] {
    let data = regionData as FeatureCollection;
    return data.features.map(region => ({
        feature: region,
        bounds: getRegionBounds(region)
    }));
}

export function getRandomLocations(giftSlots: GiftSlot[]): [number, number][] {
    let regionData = getRegionGeoJSON();
    return giftSlots.map(slot => {
        let region = regionData.find(r => r.feature.properties.nimi_fi === slot.region);
        for (let i = 0; i < 10; i++) {
            let lng = region.bounds.getWest() + Math.random() * (region.bounds.getEast() - region.bounds.getWest());
            let lat = region.bounds.getSouth() + Math.random() * (region.bounds.getNorth() - region.bounds.getSouth());
            return [lng, lat];
        }
    })
}

function getRegionBounds(region: Feature) {
    let poly = region.geometry as Polygon
    return poly.coordinates.reduce(
        (bounds, coords) =>
            coords.reduce(
                (bounds, coord) => bounds.extend(coord as [number, number]),
                bounds
            ),
        new mapboxgl.LngLatBounds()
    )
}