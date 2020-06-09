import React from "react"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO title="Home" />
      <h1>{intl.formatMessage({ id: "title" })}</h1>
    </Layout>
  )
}

export default IndexPage
