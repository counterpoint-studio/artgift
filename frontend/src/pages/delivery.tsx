import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./delivery.scss"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { useGiftState } from "../hooks"
import { INIT_GIFT } from "../constants"

const DeliveryPage = () => {
  let intl = useIntl()

  let [gift] = useGiftState(INIT_GIFT)
  useMapBackground({
    focusPoint: { className: "deliveryPage", location: gift.toLocation.point },
  })

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
      <main className="main">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "deliveryTitle" })}</h1>
          <p>{intl.formatMessage({ id: "deliveryDescription" })}</p>
        </div>
      </main>
    </Layout>
  )
}

export default DeliveryPage
