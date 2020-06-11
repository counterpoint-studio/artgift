import React, { useEffect, useState } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"
import * as gifts from "../services/gifts"
import * as regions from "../services/regionLookup"
import NextButton from "../components/nextButton"

import Logo from "../images/logo.svg"

import "./index.scss"

const IntroPage = () => {
  let intl = useIntl()
  let [introPoints, setIntroPoints] = useState<[number, number][]>([])

  useMapBackground({ center: MAP_CENTER, points: introPoints })
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
      <div className="pageContent pageContent--intro">
        <Language />
        <img
          className="introLogo"
          src={Logo}
          alt={intl.formatMessage({ id: "title" })}
        />
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
      </div>
    </Layout>
  )
}

export default IntroPage
