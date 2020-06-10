import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./gifts.scss"

const GiftsPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "title" })}
        description={intl.formatMessage({ id: "title" })}
      />
      <Helmet
        bodyAttributes={{
          class: "giftsPage",
        }}
        key="helmet"
      />
      <div className="pageContent">
        <h1>gifts page</h1>
      </div>
    </Layout>
  )
}

export default GiftsPage
