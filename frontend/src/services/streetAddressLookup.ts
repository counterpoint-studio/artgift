import GeoJsonGeometriesLookup from "geojson-geometries-lookup"

import { getGeocodingService } from "./mapbox"
import {
  MAPBOX_COUNTRY_CODE,
  MAPBOX_REGION_PLACE_NAME,
  ADDRESS_GEOCODING_PREFIX,
} from "../constants"
import { Region, GiftLocation } from "../types"
import { getWholeRegionBounds } from "./regionLookup"

export async function findAddresses(query: string, language: string) {
  let res = await getGeocodingService()
    .forwardGeocode({
      query,
      countries: [MAPBOX_COUNTRY_CODE],
      types: ["address"],
      autocomplete: true,
      bbox: getWholeRegionBounds(),
      language: [language],
      limit: 10,
    })
    .send()
  return res.body.features.filter(isInGeneralRegion).map(f => f.text)
}

export async function locateAddress(
  address: string,
  fromRegions: Region[],
  language: string
): Promise<GiftLocation | undefined> {
  let [addressPrefix] = ADDRESS_GEOCODING_PREFIX.exec(address)
  let res = await getGeocodingService()
    .forwardGeocode({
      query: addressPrefix,
      countries: [MAPBOX_COUNTRY_CODE],
      types: ["address"],
      autocomplete: false,
      bbox: getWholeRegionBounds(),
      language: [language],
      limit: 1,
    })
    .send()
  if (res.body.features.length > 0) {
    let feature = res.body.features[0]
    let point = feature.center as [number, number]
    let lookup = new GeoJsonGeometriesLookup({
      type: "FeatureCollection",
      features: fromRegions.map(r => r.feature),
    })
    let containingFeatures = lookup.getContainers({
      type: "Point",
      coordinates: point,
    })
    if (containingFeatures.features.length > 0) {
      let region = fromRegions.find(
        r =>
          r.feature.properties.id ===
          containingFeatures.features[0].properties.id
      )
      return {
        region: region.name,
        point,
      }
    }
  }
}

function isInGeneralRegion(feature: any) {
  let placeName = feature.context.find(ctx => ctx.id.startsWith("place"))
  return placeName?.text === MAPBOX_REGION_PLACE_NAME
}
