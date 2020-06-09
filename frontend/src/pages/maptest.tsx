import React, { useState } from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"
import { getRegionGeoJSON } from "../services/regionLookup"

const MapTestPage = () => {
  let [focusedRegion, setFocusedRegion] = useState<GeoJSON.Feature>()
  useMapBackground({
    center: MAP_CENTER,
    regions: getRegionGeoJSON(),
    focusedRegion,
  })

  return (
    <Layout>
      <SEO title="Home" />
      {getRegionGeoJSON().features.map((f, idx) => (
        <button
          key={idx}
          onClick={() => setFocusedRegion(getRegionGeoJSON().features[idx])}
        >
          {f.properties.nimi_fi}
        </button>
      ))}
    </Layout>
  )
}

export default MapTestPage
