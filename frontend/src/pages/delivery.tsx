import React, { useCallback } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { useGiftState } from "../hooks"
import { initGift } from "../services/gifts"

import "./delivery.scss"

const DeliveryPage = () => {
  let intl = useIntl()

  let [gift] = useGiftState(initGift(intl.locale))
  useMapBackground({
    focusPoint: gift.toLocation && {
      className: "deliveryPage",
      location: gift.toLocation.point,
    },
  })

  let getGiftLink = useCallback(() => {
    return `/${intl.locale}/gift?id=${gift.id}`
  }, [gift, intl.locale])

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
          <p>
            <a href={getGiftLink()}>
              {intl.formatMessage({ id: "deliveryGiftPageLink" })}
            </a>
            .
          </p>
        </div>
      </main>
    </Layout>
  )
}

export default DeliveryPage
