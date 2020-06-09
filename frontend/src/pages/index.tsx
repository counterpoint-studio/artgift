import React, { useEffect, useState } from "react"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"
import { getRegionGeoJSON } from "../services/regionLookup"

const IndexPage = () => {
  let intl = useIntl()

  useMapBackground({ center: MAP_CENTER, regions: getRegionGeoJSON() })

  return (
    <Layout>
      <SEO title="Home" />
      <h1>{intl.formatMessage({ id: "title" })}</h1>
    </Layout>
  )
}

export default IndexPage
