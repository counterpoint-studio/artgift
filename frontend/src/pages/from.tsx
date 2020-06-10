import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./from.scss"

const FromPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "title" })}
        description={intl.formatMessage({ id: "title" })}
      />
      <Helmet
        bodyAttributes={{
          class: "fromPage",
        }}
        key="helmet"
      />
      <div className="pageContent">
        <h1>from page</h1>
      </div>
    </Layout>
  )
}

export default FromPage
