import React, { useMemo } from "react"
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
import { INIT_GIFT } from "../constants"

const FromPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: regions[0].bounds,
    boundsPadding: 0,
    regions,
  })
  let [gift, setGift] = useGiftState(INIT_GIFT)

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
            {intl.formatMessage({ id: "fromReservedTimeStart" })} [time]{" "}
            {intl.formatMessage({ id: "fromReservedTimeEnd" })}
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

export default FromPage
