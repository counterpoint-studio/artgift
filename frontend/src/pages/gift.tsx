import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl, navigate } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import classNames from "classnames"
import qs from "qs"
import { useWindowWidth } from "@react-hook/window-size"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { Gift, GiftSlot, AppState } from "../types"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import * as gifts from "../services/gifts"
import { formatDate, formatTime } from "../services/dates"

import "./gift.scss"
import { useMounted } from "../hooks"

const emptyPoints = []

const GiftPage: React.FC<PageProps> = ({ location }) => {
  let intl = useIntl()
  let mounted = useMounted()
  let windowWidth = useWindowWidth()
  let [appState, setAppState] = useState<AppState>()
  let [gift, setGift] = useState<Gift>()
  let [slot, setSlot] = useState<GiftSlot>()
  let [cancellationReason, setCancellationReason] = useState("")

  useEffect(() => {
    let queryParams = qs.parse(location.search, { ignoreQueryPrefix: true })
    if (queryParams.id) {
      let unSubAppState = gifts.subscribeToAppState(setAppState)
      let unSubGift = gifts.subscribeToGiftWithSlot(
        queryParams.id as string,
        giftAndSlot => {
          if (giftAndSlot) {
            setGift(giftAndSlot.gift)
            setSlot(giftAndSlot.slot)
          } else {
            setGift(undefined)
            setSlot(undefined)
            navigate("/")
          }
        }
      )
      return () => {
        unSubAppState()
        unSubGift()
      }
    } else {
      setGift(undefined)
      setSlot(undefined)
      navigate("/")
    }
  }, [location.search])

  let { isMoving: isMapMoving } = useMapBackground({
    bounds: gift?.toLocation
      ? boundsAround(gift.toLocation.point)
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    isSplitScreen: windowWidth < 768,
    points: emptyPoints,
    focusPoint: gift?.toLocation && {
      className: "giftPage",
      location: gift.toLocation.point,
    },
  })

  let cancelGift = (evt: React.FormEvent) => {
    evt.preventDefault()
    if (window.confirm(intl.formatMessage({ id: "giftCancellationConfirm" }))) {
      gifts.saveGift({ ...gift, status: "cancelled", cancellationReason })
    }
  }

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "giftSEOTitle" })}
        description={intl.formatMessage({ id: "giftSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "gift mapLayout",
        }}
        key="helmet"
      />
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <div className="scroll">
          {gift && slot && (
            <div className="giftInfo">
              <h1>{intl.formatMessage({ id: "giftTitle" })}</h1>
              <div className="giftDetails">
                <h2>{intl.formatMessage({ id: "giftDetailsHeading" })}</h2>
                <table>
                  <colgroup>
                    <col className="title" />
                    <col className="description" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td>{intl.formatMessage({ id: "giftStatus" })}</td>
                      <td>
                        <span
                          className={classNames(
                            "giftStatus",
                            gift.status || "pending"
                          )}
                        >
                          {intl.formatMessage({
                            id: "giftStatus" + (gift.status || "pending"),
                          })}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>{intl.formatMessage({ id: "giftFrom" })}</td>
                      <td>{gift.fromName}</td>
                    </tr>
                    <tr>
                      <td>{intl.formatMessage({ id: "giftTo" })}</td>
                      <td>{gift.toName}</td>
                    </tr>
                    <tr>
                      <td>{intl.formatMessage({ id: "giftTime" })}</td>
                      <td>
                        {formatDate(slot.date, intl)} {formatTime(slot.time)}
                      </td>
                    </tr>
                    <tr>
                      <td>{intl.formatMessage({ id: "giftPlace" })}</td>
                      <td>{gift.toAddress}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="giftSupport">
                <h2>{intl.formatMessage({ id: "giftSupportHeading" })}</h2>
                <p
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({ id: "giftSupportMessage" }),
                  }}
                ></p>
              </div>
              {gift.status !== "cancelled" &&
                gift.status !== "rejected" &&
                appState !== "post" && (
                  <form className="giftCancellation" onSubmit={cancelGift}>
                    <h2>{intl.formatMessage({ id: "giftCancellation" })}</h2>
                    <div className="inputGroup">
                      <label>
                        {intl.formatMessage({
                          id: "giftCancellationFormLabelReason",
                        })}
                        <span className="requiredField">*</span>
                      </label>
                      <textarea
                        id="cancellationReason"
                        value={cancellationReason}
                        placeholder={intl.formatMessage({
                          id: "giftCancellationFormPlaceholderReason",
                        })}
                        onBlur={() => {}}
                        onChange={evt =>
                          setCancellationReason(evt.target.value)
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className={classNames(
                        "button button--small button--cancel",
                        {
                          disabled: cancellationReason.trim().length === 0,
                        }
                      )}
                      disabled={cancellationReason.trim().length === 0}
                    >
                      {intl.formatMessage({
                        id: "giftCancellationFormSubmit",
                      })}
                    </button>
                  </form>
                )}
              {gift.status === "cancelled" && (
                <div className="giftCancelled">
                  <h2>{intl.formatMessage({ id: "giftCancelled" })}</h2>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: intl.formatMessage({
                        id: "giftCancelledMessage",
                      }),
                    }}
                  ></p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
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
