import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

export const geocodingService = mbxGeocoding({ accessToken: process.env.GATSBY_MAPBOX_ACCESS_TOKEN })