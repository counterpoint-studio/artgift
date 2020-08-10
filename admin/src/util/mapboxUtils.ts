import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import GeoJsonGeometriesLookup from 'geojson-geometries-lookup';
import { FeatureCollection } from 'geojson';

import { Region, GiftLocation } from '../types';
import { MAPBOX_COUNTRY_CODE, MAPBOX_LANGUAGE_CODE, REGION_BOUNDING_BOX } from '../constants';

import regionData from '../data/region_data.json';

export const geocodingService = mbxGeocoding({ accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN! })


export async function locateAddress(address: string, fromRegions: Region[]): Promise<GiftLocation | undefined> {
    let addressPrefixMatch = /.*?\d+/.exec(address);
    if (!addressPrefixMatch) {
        return;
    }
    let addressPrefix = addressPrefixMatch[0];

    let res = await geocodingService.forwardGeocode({
        mode: 'mapbox.places',
        query: addressPrefix,
        countries: [MAPBOX_COUNTRY_CODE],
        types: ['address'],
        autocomplete: false,
        bbox: [...REGION_BOUNDING_BOX[0], ...REGION_BOUNDING_BOX[1]] as any,
        language: [MAPBOX_LANGUAGE_CODE],
        limit: 1
    }).send()
    if (res.body.features.length > 0) {
        let feature = res.body.features[0];
        let point = feature.center as [number, number];
        let lookup = new GeoJsonGeometriesLookup({ type: 'FeatureCollection', features: fromRegions.map(r => r.feature) });
        let containingFeatures = lookup.getContainers({ type: 'Point', coordinates: point });
        if (containingFeatures.features.length > 0) {
            let region = fromRegions.find(r => r.feature.properties?.id === containingFeatures.features[0].properties.id);
            return {
                region: region!.name,
                point
            }
        }
    }
}

export function getRegionGeoJSON(): Region[] {
    let data = regionData as FeatureCollection;
    return data.features.map(region => ({
        name: region.properties!.nimi_fi,
        feature: region
    }));
}
