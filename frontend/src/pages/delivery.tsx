import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./delivery.scss"

const DeliveryPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "fromSEOTitle" })}
        description={intl.formatMessage({ id: "fromSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "delivery",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--delivery">
        <main className="main">
          <h1>{intl.formatMessage({ id: "deliveryTitle" })}</h1>
          <p>{intl.formatMessage({ id: "deliveryDescription" })}</p>
        </main>
      </div>
    </Layout>
  )
}

export default DeliveryPage
