import React, { useMemo } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"

import "./from.scss"
import { useMounted } from "../hooks"
import { getRegionGeoJSON } from "../services/regionLookup"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"

const FromPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: regions[0].bounds,
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
            {intl.formatMessage({ id: "fromReservedTimeStart" })} [time]{" "}
            {intl.formatMessage({ id: "fromReservedTimeEnd" })}
          </p>
          <form>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelName" })}:</label>
              <input type="text" />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelPhone" })}:</label>
              <input type="text" />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "fromFormLabelEmail" })}:</label>
              <input type="text" />
            </div>
            <div className="inputGroup">
              <label>
                {intl.formatMessage({ id: "fromFormLabelSpecialInfo" })}:
              </label>
              <textarea></textarea>
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
