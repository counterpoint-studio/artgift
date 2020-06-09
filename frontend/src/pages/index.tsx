import React, { useEffect, useState } from "react"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"
import * as gifts from "../services/gifts"
import * as regions from "../services/regionLookup"

const IndexPage = () => {
  let intl = useIntl()
  let [introPoints, setIntroPoints] = useState<[number, number][]>([])

  useMapBackground({ center: MAP_CENTER, points: introPoints })
  useEffect(() => {
    gifts.subscribeToGiftSlotsOverview(giftSlots =>
      setIntroPoints(regions.getRandomLocations(giftSlots))
    )
  }, [])

  return (
    <Layout>
      <SEO title="Home" />
      <h1>{intl.formatMessage({ id: "title" })}</h1>
    </Layout>
  )
}

export default IndexPage
