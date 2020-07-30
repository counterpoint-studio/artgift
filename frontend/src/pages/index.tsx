import React, { useEffect, useState, useContext } from "react"
import Helmet from "react-helmet"
import { useIntl, Link } from "gatsby-plugin-intl"
import classNames from "classnames"
import { every } from "lodash"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MapBackgroundContext } from "../../plugins/gatsby-plugin-map-background/mapBackgroundContext"
import { REGION_BOUNDING_BOX, MAP_INIT_CENTER } from "../constants"
import * as gifts from "../services/gifts"
import * as regions from "../services/regionLookup"
import NextButton from "../components/nextButton"
import HeroImage from "../images/heroImage.jpg"

import "./index.scss"
import { useGiftState } from "../hooks"
import { useWindowWidth } from "@react-hook/window-size"
import { AppState } from "../types"

const IntroPage = () => {
  let intl = useIntl()
  let windowWidth = useWindowWidth()
  let [appState, setAppState] = useState<AppState>()
  let [allBooked, setAllBooked] = useState(false)
  let [pointsLoaded, setPointsLoaded] = useState(false)

  let mapContext = useContext(MapBackgroundContext)
  let { isMoving: isMapMoving } = useMapBackground({
    initPoint: MAP_INIT_CENTER,
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: windowWidth < 768 ? 0 : 150,
    regions: undefined,
  })
  let [gift, setGift] = useGiftState(gifts.initGift(intl.locale))

  useEffect(() => {
    let unSubState = gifts.subscribeToAppState(setAppState)
    let unSubSlots = gifts.subscribeToGiftSlotsOverview(giftSlots => {
      let availableSlots = giftSlots.filter(s => s.status !== "reserved")
      mapContext.update({
        points: regions.getRandomLocationsForVisualisation(availableSlots),
      })
      setPointsLoaded(true)
      setAllBooked(every(giftSlots, s => s.status === "reserved"))
    })
    return () => {
      unSubState()
      unSubSlots()
    }
  }, [])

  let initialiseGift = () => {
    setGift(gifts.initGift(intl.locale))
  }

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
          isVisible: pointsLoaded && !isMapMoving,
        })}
      >
        <img
          className="heroImage"
          src={HeroImage}
          alt={intl.formatMessage({ id: "introTitle" })}
        />
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
          {appState === "open" && (
            <NextButton
              to="/info"
              text={intl.formatMessage({ id: "introButtonNext" })}
              onClick={initialiseGift}
            />
          )}
          {appState === "pre" && (
            <p
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: "introNotOpenYet" }),
              }}
            />
          )}
          {(appState === "post" || allBooked) && (
            <p
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: "introClosed" }),
              }}
            />
          )}
          {appState === "paused" && (
            <p
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: "introPaused" }),
              }}
            />
          )}
          <div className="introFooter">
            <Link to="/faqs" className="introLink introLink--faqs">
              {intl.formatMessage({ id: "FAQsLink" })}
            </Link>
            <Link to="/privacy" className="introLink introLink--privacy">
              {intl.formatMessage({ id: "privacyLink" })}
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  )
}

export default IntroPage
