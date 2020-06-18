import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import qs from "qs"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { Gift, GiftSlot } from "../types"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import * as gifts from "../services/gifts"
import { formatDate, formatTime } from "../services/dates"

import "./gift.scss"

const emptyPoints = []

const GiftPage: React.FC<PageProps> = ({ location }) => {
  let intl = useIntl()
  let [gift, setGift] = useState<Gift>()
  let [slot, setSlot] = useState<GiftSlot>()

  useEffect(() => {
    let queryParams = qs.parse(location.search, { ignoreQueryPrefix: true })
    if (queryParams.id) {
      gifts.getGiftWithSlot(queryParams.id as string).then(({ gift, slot }) => {
        setGift(gift)
        setSlot(slot)
      })
    } else {
      setGift(undefined)
      setSlot(undefined)
    }
  }, [location.search])

  useMapBackground({
    bounds: gift?.toLocation
      ? boundsAround(gift.toLocation.point)
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    points: emptyPoints,
    focusPoint: gift?.toLocation && {
      className: "giftPage",
      location: gift.toLocation.point,
    },
  })

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
        {gift && slot && (
          <div className="giftInfo">
            <h1>{intl.formatMessage({ id: "giftTitle" })}</h1>
            <p>
              {intl.formatMessage({ id: "giftStatus" })}:
              {intl.formatMessage({
                id: "giftStatus" + (gift.status || "pending"),
              })}
            </p>
            <p>
              {intl.formatMessage({ id: "giftTime" })}:
              {formatDate(slot.date, intl)} {formatTime(slot.time)}
            </p>
            <p>
              {intl.formatMessage({ id: "giftPlace" })}:{gift.toAddress}
            </p>
            <p>
              {intl.formatMessage({ id: "giftFrom" })}:{gift.fromName}
            </p>
            <p>
              {intl.formatMessage({ id: "giftTo" })}:{gift.toName}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

function boundsAround([lng, lat]: [number, number]) {
  return [
    [lng - 0.002, lat - 0.002],
    [lng + 0.002, lat + 0.002],
  ]
}

export default GiftPage
