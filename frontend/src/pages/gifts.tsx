import React, { useState, useEffect, useMemo } from "react"
import Helmet from "react-helmet"
import { useIntl, Link, IntlShape } from "gatsby-plugin-intl"
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
  let [slotsByDate, setSlotsByDate] = useState<{ [date: string]: GiftSlot[] }>(
    {}
  )
  let [selectedDate, setSelectedDate] = useState<string>()
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
    let unSub = subscribeToGiftSlotsInRegion(gift.toLocation.region, slots => {
      setSelectedDate(sel => sel || Object.keys(slots)[0])
      setSlotsByDate(slots)
    })
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
          <div className="giftDates">
            {Object.keys(slotsByDate).map(date => (
              <div
                key={date}
                className={classNames("giftDate", {
                  isSelected: date === selectedDate,
                })}
                onClick={() => setSelectedDate(date)}
              >
                {formatDate(date, intl)}
              </div>
            ))}
          </div>
          <table className="giftsTable">
            <tbody>
              {slotsByDate[selectedDate]?.map(slot => (
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

function formatDate(dateS: string, intl: IntlShape) {
  let y = +dateS.substring(0, 4)
  let m = +dateS.substring(4, 6)
  let d = +dateS.substring(6, 8)
  let date = new Date(y, m - 1, d)
  let dayOfWeek = intl.formatMessage({ id: `dayOfWeek${date.getDay()}` })
  return `${dayOfWeek} ${d}.${m}.`
}

function formatTime(time: string) {
  let [hours, minutes] = time.split(":").map(t => +t)
  let h = hours < 10 ? `0${hours}` : `${hours}`
  let m = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${h}:${m}`
}

export default GiftsPage
