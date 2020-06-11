import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./gift.scss"

const GiftPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "giftSEOTitle" })}
        description={intl.formatMessage({ id: "giftSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "gift",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--gift">
        <div className="giftMap"></div>
        <div className="giftInfo">
          <h1>{intl.formatMessage({ id: "giftTitle" })}</h1>
        </div>
      </div>
    </Layout>
  )
}

export default GiftPage
