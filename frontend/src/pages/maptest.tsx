import React, { useState, useEffect } from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import { Region, getRegionGeoJSON } from "../services/regionLookup"

const MapTestPage = () => {
  let [regions, setRegions] = useState<Region[]>([])
  let [focusedRegion, setFocusedRegion] = useState<Region>()
  useMapBackground({
    bounds: focusedRegion ? focusedRegion.bounds : REGION_BOUNDING_BOX,
    regions,
  })
  useEffect(() => {
    setRegions(getRegionGeoJSON())
  }, [])

  return (
    <Layout>
      <SEO title="Home" />
      {regions.map((f, idx) => (
        <button key={idx} onClick={() => setFocusedRegion(regions[idx])}>
          {f.feature.properties.nimi_fi}
        </button>
      ))}
    </Layout>
  )
}

export default MapTestPage
