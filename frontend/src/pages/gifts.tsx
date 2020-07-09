import React, { useState, useEffect, useMemo, useCallback } from "react"
import Helmet from "react-helmet"
import { useIntl, navigate } from "gatsby-plugin-intl"
import classNames from "classnames"
import { camelCase } from "lodash"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"
import {
  subscribeToGiftSlotsInRegion,
  initGift,
  saveGift,
} from "../services/gifts"

import { getRegionGeoJSON } from "../services/regionLookup"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { useMounted, useGiftState } from "../hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import { GiftSlot } from "../types"

import "./gifts.scss"
import { formatDate, formatTime } from "../services/dates"

const GiftsPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let [slotsByDate, setSlotsByDate] = useState<{ [date: string]: GiftSlot[] }>(
    {}
  )
  let [selectedDate, setSelectedDate] = useState<string>()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let [gift, setGift] = useGiftState(initGift(intl.locale))

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

  let onPickSlot = useCallback(
    async (slot: GiftSlot) => {
      let reserved = await saveGift({ ...gift, slotId: slot.id })
      setGift(reserved)
      if (reserved.slotId === slot.id) {
        navigate("/from") // Successful reservation
      }
    },
    [gift]
  )

  let isAvailable = useCallback(
    (slot: GiftSlot) => {
      return slot.status === "available" || gift.slotId === slot.id
    },
    [gift]
  )

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
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <h1>
          {intl.formatMessage({ id: "giftsTitle" })}{" "}
          {intl.formatMessage({
            id: `region${camelCase(gift.toLocation?.region.toLowerCase())}`,
          })}
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
        <div className="giftsTableWrapper">
          <table className="giftsTable">
            <tbody>
              {slotsByDate[selectedDate]?.map(slot => (
                <tr key={slot.id} className={slot.status}>
                  <td className="giftsTableTime">{formatTime(slot.time)}</td>
                  <td className="giftsTableBook">
                    <button
                      className={classNames("button", "button--book", {
                        disabled: !isAvailable(slot),
                      })}
                      onClick={() => onPickSlot(slot)}
                      disabled={!isAvailable(slot)}
                    >
                      {intl.formatMessage({ id: "giftsButtonBook" })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BackButton to="/to" text={intl.formatMessage({ id: "backButton" })} />
      </main>
    </Layout>
  )
}

export default GiftsPage
