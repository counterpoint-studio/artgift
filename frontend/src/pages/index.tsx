import React, { useEffect, useState } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_CENTER } from "../constants"
import * as gifts from "../services/gifts"
import * as regions from "../services/regionLookup"

import Logo from "../images/imagePlaceholder.svg"

import "./index.scss"

const IntroPage = () => {
  let intl = useIntl()
  let [isVisible, setVisible] = useState(false)
  let [introPoints, setIntroPoints] = useState<[number, number][]>([])

  let { isMoving: isMapMoving } = useMapBackground({
    center: MAP_CENTER,
    points: introPoints,
  })

  useEffect(() => {
    gifts.subscribeToGiftSlotsOverview(giftSlots =>
      setIntroPoints(regions.getRandomLocations(giftSlots))
    )
    setTimeout(() => setVisible(true), 2000)
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
          isVisible: !isMapMoving,
        })}
      >
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
        <a href="/to" className="button button--next">
          {intl.formatMessage({ id: "introButtonNext" })}
        </a>
      </div>
    </Layout>
  )
}

export default IntroPage
