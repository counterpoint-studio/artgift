import React, { useEffect, useState } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX, MAP_INIT_CENTER } from "../constants"
import * as gifts from "../services/gifts"
import * as regions from "../services/regionLookup"
import NextButton from "../components/nextButton"

import "./index.scss"
import { useMounted } from "../hooks"

const IntroPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let [introPoints, setIntroPoints] = useState<[number, number][]>([])

  let { isMoving: isMapMoving } = useMapBackground({
    initPoint: MAP_INIT_CENTER,
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: 150,
    points: introPoints,
    regions: undefined,
  })

  useEffect(() => {
    gifts.subscribeToGiftSlotsOverview(giftSlots =>
      setIntroPoints(regions.getRandomLocations(giftSlots))
    )
  }, [])

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "introSEOTitle" })}
        description={intl.formatMessage({ id: "introSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "intro",
        }}
        key="helmet"
      />
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <div className="scroll">
          <Language />
          <h1 className="introTitle">
            {intl.formatMessage({ id: "introTitle" })}
          </h1>
          <div className="introBody">
            <p>{intl.formatMessage({ id: "introBody" })}</p>
            <p>
              {intl.formatMessage({ id: "introMoreInfo" })}:{" "}
              <a
                href="https://helsinkifest.fi"
                target="_blank"
                rel="noopener noreferrer"
              >
                helsinkifest.fi
              </a>
            </p>
          </div>
          <NextButton
            to="/to"
            text={intl.formatMessage({ id: "introButtonNext" })}
          />
        </div>
      </main>
    </Layout>
  )
}

export default IntroPage
