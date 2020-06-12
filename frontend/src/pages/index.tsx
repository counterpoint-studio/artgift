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

import Logo from "../images/logo.svg"

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
      <div
        className={classNames("pageContent", "pageContent--intro", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <header className="header">
          <Language />
          {/* <img
            className="introLogo"
            src={Logo}
            alt={intl.formatMessage({ id: "title" })}
          /> */}
        </header>
        <main className="main">
          <h1 className="introTitle">
            {intl.formatMessage({ id: "introTitle" })}
          </h1>
          <div className="introBody">
            <p>{intl.formatMessage({ id: "introBody" })}</p>
          </div>
          <NextButton
            to="/to"
            text={intl.formatMessage({ id: "introButtonNext" })}
          />
        </main>
      </div>
    </Layout>
  )
}

export default IntroPage
