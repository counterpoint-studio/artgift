import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl, navigate, IntlShape } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import qs from "qs"
import classNames from "classnames"
import { camelCase, flatMap } from "lodash"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { Gift, GiftSlot, Artist } from "../types"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import * as gifts from "../services/gifts"
import { formatDate, formatTime } from "../services/dates"

import "./artist.scss"

const emptyPoints = []

const ArtistPage: React.FC<PageProps> = ({ location }) => {
  let intl = useIntl()
  let [artist, setArtist] = useState<Artist>()
  let [giftsAndSlots, setGiftsAndSlots] = useState<{
    [giftId: string]: { gift: Gift; slot: GiftSlot }
  }>({})
  let [detailedAssignment, setDetailedAssignment] = useState<{
    gift: Gift
    slot: GiftSlot
  }>()

  useEffect(() => {
    let queryParams = qs.parse(location.search, { ignoreQueryPrefix: true })
    let unsubscriptions: (() => void)[] = []
    let stillMounted = true
    if (queryParams.id) {
      unsubscriptions.push(
        gifts.subscribeToArtist(queryParams.id as string, artist => {
          if (!stillMounted) return
          setArtist(artist)

          let giftIds = flatMap(artist.itineraries, it =>
            it.assignments.map(a => a.giftId)
          )
          for (let giftId of giftIds) {
            unsubscriptions.push(
              gifts.subscribeToGiftWithSlot(giftId, giftAndSlot =>
                setGiftsAndSlots(g => ({ ...g, [giftId]: giftAndSlot }))
              )
            )
          }
        })
      )
    } else {
      setArtist(undefined)
      navigate("/")
    }
    return () => {
      stillMounted = false
      unsubscriptions.forEach(u => u())
    }
  }, [location.search])

  useMapBackground({
    bounds: detailedAssignment?.gift?.toLocation
      ? boundsAround(detailedAssignment?.gift.toLocation.point)
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    points: emptyPoints,
    focusPoint: detailedAssignment?.gift?.toLocation && {
      className: "artistPage",
      location: detailedAssignment?.gift?.toLocation.point,
    },
  })

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "artistSEOTitle" })}
        description={intl.formatMessage({ id: "artistSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "artistPage",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--artist">
        {artist && (
          <div className="artistInfo">
            <h1>{artist.name}</h1>
            {artist.itineraries.map((it, idx) => (
              <div key={idx} className="artistItinerary">
                <h2>
                  {formatDate(it.from.date, intl)} {formatTime(it.from.time)} -{" "}
                  {formatTime(it.from.time)}{" "}
                  {intl.formatMessage({
                    id: `region${camelCase(it.region.toLowerCase())}`,
                  })}
                </h2>
                {it.assignments.map(a => (
                  <div
                    key={a.giftId}
                    className={classNames("artistAssignment", {
                      detailsOpen:
                        detailedAssignment === giftsAndSlots[a.giftId],
                    })}
                    onClick={() =>
                      setDetailedAssignment(giftsAndSlots[a.giftId])
                    }
                  >
                    {giftsAndSlots[a.giftId] &&
                      renderAssignment(
                        giftsAndSlots[a.giftId].gift,
                        giftsAndSlots[a.giftId].slot,
                        detailedAssignment === giftsAndSlots[a.giftId],
                        intl
                      )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function renderAssignment(
  gift: Gift,
  slot: GiftSlot,
  withDetails: boolean,
  intl: IntlShape
) {
  return (
    <>
      {formatTime(slot.time)} {gift.toAddress}
      {withDetails && (
        <div className="artistAssignmentDetails">
          <div>
            {intl.formatMessage({ id: "artistGiftFrom" })}: {gift.fromName} &lt;
            {gift.fromEmail}&gt; {gift.fromPhoneNumber}
          </div>
          <div>
            {intl.formatMessage({ id: "artistGiftTo" })}: {gift.toName}
          </div>
          <div>
            {intl.formatMessage({ id: "artistGiftLanguage" })}:{" "}
            {gift.toLanguage}
          </div>
          <div>
            {intl.formatMessage({ id: "artistGiftReason" })}:{" "}
            {gift.toSignificance}
          </div>
          <div>
            {intl.formatMessage({ id: "artistGiftMessage" })}:{" "}
            {gift.fromMessage || "-"}
          </div>
        </div>
      )}
    </>
  )
}

function boundsAround([lng, lat]: [number, number]) {
  return [
    [lng - 0.002, lat - 0.002],
    [lng + 0.002, lat + 0.002],
  ]
}

export default ArtistPage
