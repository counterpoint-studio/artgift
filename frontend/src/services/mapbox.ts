import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding"

let geocodingService: any

export function getGeocodingService() {
  if (!geocodingService) {
    geocodingService = mbxGeocoding({
      accessToken: process.env.GATSBY_MAPBOX_ACCESS_TOKEN,
    })
  }
  return geocodingService
}
