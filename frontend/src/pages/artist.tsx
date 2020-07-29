import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl, navigate, IntlShape } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import qs from "qs"
import classNames from "classnames"
import { camelCase, flatMap } from "lodash"
import { useWindowWidth } from "@react-hook/window-size"
import { useMounted } from "../hooks"

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
  let mounted = useMounted()
  let windowWidth = useWindowWidth()
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
    isSplitScreen: windowWidth < 768,
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
          class: "artist mapLayout",
        }}
        key="helmet"
      />
      <main
        className={classNames("main", {
          isVisible: mounted,
        })}
      >
        <div className="scroll">
          {artist && (
            <div className="artistInfo">
              <h1>{artist.name}</h1>
              {artist.itineraries.map((it, idx) => (
                <div key={idx} className="day">
                  <div className="dayHeading">
                    <div className="date">{formatDate(it.from.date, intl)}</div>
                    <div className="timeLocation">
                      {formatTime(it.from.time)} - {formatTime(it.to.time)} /{" "}
                      {intl.formatMessage({
                        id: `region${camelCase(it.region.toLowerCase())}`,
                      })}
                    </div>
                  </div>
                  <div className="assignments">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
      <div className="artistAssignmentHeader">
        <svg
          className="arrow"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 14"
        >
          <path
            fill="black"
            d="M13.92,7.38a.92.92,0,0,0,0-.76,1.15,1.15,0,0,0-.21-.33l-6-6a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.42L10.58,6H1A1,1,0,0,0,1,8h9.58L6.27,12.29a1,1,0,0,0,0,1.41h0A1,1,0,0,0,7,14a1,1,0,0,0,.71-.29l6-6A1.29,1.29,0,0,0,13.92,7.38Z"
          />
        </svg>
        <div className="time">{formatTime(slot.time)}</div>{" "}
        <div className="address">{gift.toAddress}</div>
      </div>
      {withDetails && (
        <div className="artistAssignmentDetails">
          <table>
            <colgroup>
              <col className="title" />
              <col className="description" />
            </colgroup>
            <tbody>
              <tr>
                <td>{intl.formatMessage({ id: "artistGiftFrom" })}</td>
                <td>
                  {gift.fromName}
                  <br />
                  <a className="email" href={`mailto:${gift.fromEmail}`}>
                    {gift.fromEmail}
                  </a>
                  <br />
                  <a className="phone" href={`tel:#31#${gift.fromPhoneNumber}`}>
                    <span className="phonePrivacyPrefix">#31#</span>
                    {gift.fromPhoneNumber}
                  </a>
                </td>
              </tr>
              <tr>
                <td>{intl.formatMessage({ id: "artistGiftTo" })}</td>
                <td>{gift.toName}</td>
              </tr>
              <tr>
                <td>{intl.formatMessage({ id: "artistGiftLanguage" })}</td>
                <td>{gift.toLanguage}</td>
              </tr>
              <tr>
                <td>{intl.formatMessage({ id: "artistGiftReason" })}</td>
                <td>{gift.toSignificance}</td>
              </tr>
              <tr>
                <td>{intl.formatMessage({ id: "artistGiftMessage" })}</td>
                <td>{gift.fromMessage || "-"}</td>
              </tr>
              {gift.toLocation?.point && (
                <tr>
                  <td></td>
                  <td>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${gift.toLocation.point[1]},${gift.toLocation.point[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {intl.formatMessage({ id: "artistGiftGoogleMapsLink" })}
                    </a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
