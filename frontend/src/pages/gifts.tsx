import React, { useState, useEffect, useMemo } from "react"
import Helmet from "react-helmet"
import { useIntl, Link } from "gatsby-plugin-intl"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { subscribeToGiftSlotsInRegion } from "../services/gifts"

import { getRegionGeoJSON } from "../services/regionLookup"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { useMounted, useGiftState } from "../hooks"
import { INIT_GIFT, REGION_BOUNDING_BOX } from "../constants"
import { GiftSlot } from "../types"

import "./gifts.scss"

const GiftsPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let [slots, setSlots] = useState<GiftSlot[]>([])
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let [gift, setGift] = useGiftState(INIT_GIFT)
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: gift.toLocation
      ? regions.find(r => r.name === gift.toLocation.region).bounds
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    regions,
  })

  useEffect(() => {
    if (!gift.toLocation) return
    let unSub = subscribeToGiftSlotsInRegion(gift.toLocation.region, setSlots)
    return () => {
      unSub()
    }
  }, [gift])

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "giftsSEOTitle" })}
        description={intl.formatMessage({ id: "giftsSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "gifts",
        }}
        key="helmet"
      />
      <div
        className={classNames("pageContent", "pageContent--gifts", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <main className="main">
          <h1>
            {intl.formatMessage({ id: "giftsTitle" })} {gift.toLocation?.region}
          </h1>
          <table className="giftsTable">
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td className="giftsTableTime">{formatTime(slot.time)}</td>
                  <td className="giftsTableBook">
                    <Link
                      to="/from"
                      className="button button--book"
                      onClick={() => setGift({ ...gift, slotId: slot.id })}
                    >
                      {intl.formatMessage({ id: "giftsButtonBook" })}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </Layout>
  )
}

function formatTime(time: string) {
  let [hours, minutes] = time.split(":").map(t => +t)
  let h = hours < 10 ? `0${hours}` : `${hours}`
  let m = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${h}:${m}`
}

export default GiftsPage
