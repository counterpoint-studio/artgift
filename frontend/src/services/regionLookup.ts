import regionData from '../data/region_data.json';

export function getRegionGeoJSON(): GeoJSON.FeatureCollection {
    return regionData as GeoJSON.FeatureCollection;
}