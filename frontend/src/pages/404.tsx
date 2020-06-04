import React from "react"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = () => {
  let intl = useIntl()
  return (
    <Layout>
      <SEO title={intl.formatMessage({ id: "404SEOTitle" })} />
      <h1>{intl.formatMessage({ id: "404Title" })}</h1>
      <p>{intl.formatMessage({ id: "404Body" })}</p>
    </Layout>
  )
}

export default NotFoundPage
