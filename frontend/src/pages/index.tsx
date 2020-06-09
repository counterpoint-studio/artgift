import React from "react"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"

const IndexPage = () => {
  let intl = useIntl()

  useMapBackground({ center: MAP_CENTER })

  return (
    <Layout>
      <SEO title="Home" />
      <h1>{intl.formatMessage({ id: "title" })}</h1>
    </Layout>
  )
}

export default IndexPage
