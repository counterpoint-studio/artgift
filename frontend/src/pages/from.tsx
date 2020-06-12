import React, { useMemo, useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"

import "./from.scss"
import { useMounted, useGiftState } from "../hooks"
import { getRegionGeoJSON } from "../services/regionLookup"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { INIT_GIFT, REGION_BOUNDING_BOX } from "../constants"
import { getGiftSlot } from "../services/gifts"
import { GiftSlot } from "../types"
import { formatTime, formatDate } from "../services/dates"

const FromPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let [gift, setGift] = useGiftState(INIT_GIFT)
  let [giftSlot, setGiftSlot] = useState<GiftSlot>()
  useEffect(() => {
    console.log("load slot")
    getGiftSlot(gift.slotId).then(setGiftSlot)
  }, [gift?.slotId])
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: gift.toLocation
      ? boundsAround(gift.toLocation.point)
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    regions,
  })

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "fromSEOTitle" })}
        description={intl.formatMessage({ id: "fromSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "from",
        }}
        key="helmet"
      />
      <div
        className={classNames("pageContent", "pageContent--from", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <main className="main">
          <h1>{intl.formatMessage({ id: "fromTitle" })}</h1>
          <p>
            {intl.formatMessage({ id: "fromReservedTimeStart" })}{" "}
            {giftSlot && (
              <>
                {formatDate(giftSlot.date, intl)} {formatTime(giftSlot.time)}
              </>
            )}
            . {intl.formatMessage({ id: "fromReservedTimeEnd" })}
          </p>
          <form>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelName" })}:</label>
              <input
                type="text"
                maxLength={50}
                value={gift.fromName}
                onChange={evt =>
                  setGift({ ...gift, fromName: evt.currentTarget.value })
                }
              />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelPhone" })}:</label>
              <input
                type="text"
                maxLength={25}
                value={gift.fromPhoneNumber}
                onChange={evt =>
                  setGift({ ...gift, fromPhoneNumber: evt.currentTarget.value })
                }
              />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelEmail" })}:</label>
              <input
                type="email"
                value={gift.fromEmail}
                onChange={evt =>
                  setGift({ ...gift, fromEmail: evt.currentTarget.value })
                }
              />
            </div>
            <div className="inputGroup">
              <label>
                {intl.formatMessage({ id: "fromFormLabelSpecialInfo" })}:
              </label>
              <textarea
                maxLength={1000}
                value={gift.fromMessage}
                onChange={evt =>
                  setGift({ ...gift, fromMessage: evt.currentTarget.value })
                }
              ></textarea>
            </div>
            <NextButton
              to="/delivery"
              text={intl.formatMessage({ id: "fromButtonNext" })}
            />
          </form>
        </main>
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

export default FromPage
