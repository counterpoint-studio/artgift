import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from "react"
import { PageProps } from "gatsby"
import Helmet from "react-helmet"
import { useIntl, navigate } from "gatsby-plugin-intl"
import classNames from "classnames"
import { camelCase, omit, groupBy, fromPairs, toPairs, sumBy } from "lodash"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"
import {
  subscribeToGiftSlotsInRegion,
  reserveSlot,
  saveGift,
  initGift,
  subscribeToGiftSlotsOverview,
} from "../services/gifts"

import {
  getRegionGeoJSON,
  getRandomLocationsForVisualisation,
} from "../services/regionLookup"
import { MapBackgroundContext } from "../../plugins/gatsby-plugin-map-background/mapBackgroundContext"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { useMounted, useGiftState } from "../hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import { GiftSlot } from "../types"

import "./gifts.scss"
import { formatDate, formatTime } from "../services/dates"

const GiftsPage: React.FC<PageProps> = ({ location }) => {
  let intl = useIntl()
  let mounted = useMounted()
  let [slotsByDate, setSlotsByDate] = useState<{ [date: string]: GiftSlot[] }>(
    {}
  )
  let [selectedDate, setSelectedDate] = useState<string>()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let [gift, setGift] = useGiftState(initGift(intl.locale))
  let [reservingSlotId, setReservingSlotId] = useState<string>()
  let [failedToReserve, setFailedToReserve] = useState(false)
  let mapContext = useContext(MapBackgroundContext)
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: gift?.toLocation
      ? regions.find(r => r.name === gift.toLocation.region).bounds
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    focusPoint: gift.toLocation && {
      className: "giftsPage",
      location: gift.toLocation.point,
    },
  })

  useEffect(() => {
    if (gift.toName === "") {
      navigate("/")
    } else if (gift.status === "pending") {
      navigate("/delivery")
    } else {
      if (!gift.toLocation) return
      let unSub = subscribeToGiftSlotsInRegion(
        gift.toLocation.region,
        slots => {
          setSelectedDate(sel => sel || Object.keys(slots)[0])
          setSlotsByDate(slots)
        }
      )
      return () => {
        unSub()
      }
    }
  }, [gift])

  useEffect(() => {
    let unSubSlots = subscribeToGiftSlotsOverview(giftSlots => {
      let availableSlots = giftSlots.filter(s => s.status !== "reserved")
      let slotsByRegion = groupBy(giftSlots, s => s.region)
      let availabilityByRegion = fromPairs(
        toPairs(slotsByRegion).map(([region, slots]) => [
          region,
          sumBy(slots, slot => (slot.status !== "reserved" ? 1 : 0)),
        ])
      )
      mapContext.update({
        points: getRandomLocationsForVisualisation(availableSlots),
        regions: regions
          .filter(r => r.name === gift?.toLocation?.region)
          .map(r => ({
            ...r,
            status: availabilityByRegion[r.name] ? "available" : "unavailable",
          })),
      })
    })
    return () => {
      unSubSlots()
    }
  }, [])

  let onPickSlot = useCallback(
    async (slot: GiftSlot) => {
      setReservingSlotId(slot.id)
      setFailedToReserve(false)
      let savedGift = await saveGift(omit(gift, "slotId"))
      let reserved = await reserveSlot(savedGift, slot.id)
      setGift(reserved)
      setReservingSlotId(undefined)
      if (reserved.slotId === slot.id) {
        navigate("/from") // Successful reservation
      } else {
        setFailedToReserve(true)
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
          {intl.formatMessage({ id: "giftsTitle" })}:{" "}
          {intl.formatMessage({
            id: `region${camelCase(gift.toLocation?.region.toLowerCase())}`,
          })}
        </h1>
        {(location?.state as any)?.reservationExpired && (
          <p className="message">
            {intl.formatMessage({ id: "giftsReservationExpired" })}
          </p>
        )}
        {failedToReserve && (
          <p className="message">
            {intl.formatMessage({ id: "giftsFailedToReserve" })}
          </p>
        )}
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
                      disabled={!isAvailable(slot) || !!reservingSlotId}
                    >
                      {intl.formatMessage({
                        id:
                          reservingSlotId === slot.id
                            ? "giftsButtonBooking"
                            : "giftsButtonBook",
                      })}
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
