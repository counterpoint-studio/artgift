import React, { useState } from "react"
import Helmet from "react-helmet"
import { useIntl, Link } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import classNames from "classnames"
import { useWindowWidth } from "@react-hook/window-size"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import BackButton from "../components/backButton"

import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_INIT_CENTER, REGION_BOUNDING_BOX } from "../constants"
import { initGift } from "../services/gifts"

import { useMounted, useGiftState } from "../hooks"

import "./info.scss"

const InfoPage: React.FC<PageProps> = () => {
  let mounted = useMounted()
  let intl = useIntl()
  let windowWidth = useWindowWidth()
  let { isMoving: isMapMoving } = useMapBackground({
    initPoint: MAP_INIT_CENTER,
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: windowWidth < 768 ? 0 : 150,
    regions: undefined,
  })
  let [attendanceAccepted, setAttendanceAccepted] = useState(false)
  let [gdprAccepted, setGdprAccepted] = useState(false)
  let [gift, setGift] = useGiftState(initGift(intl.locale))

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "infoSEOTitle" })}
        description={intl.formatMessage({ id: "infoSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "info",
        }}
        key="helmet"
      />
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "infoTitle" })}</h1>
          <p>{intl.formatMessage({ id: "infoDescription" })}</p>
          <div className="checkboxes">
            <div className="inputGroup">
              <div className="inputCheckbox">
                <input
                  type="checkbox"
                  id="infoRequirementAttendance"
                  checked={attendanceAccepted}
                  onChange={evt => setAttendanceAccepted(evt.target.checked)}
                />
                <label htmlFor="infoRequirementAttendance">
                  {intl.formatMessage({ id: "infoRequirementAttendance" })}{" "}
                  <span className="requiredField">*</span>
                </label>
              </div>
            </div>
            <div className="inputGroup">
              <div className="inputCheckbox">
                <input
                  type="checkbox"
                  id="infoRequirementGDPR"
                  checked={gdprAccepted}
                  onChange={evt => setGdprAccepted(evt.target.checked)}
                />
                <label htmlFor="infoRequirementGDPR">
                  {intl.formatMessage({ id: "infoRequirementGDPR" })}{" "}
                  <span className="requiredField">*</span>
                </label>
              </div>
            </div>
            <div className="inputGroup">
              <div className="inputCheckbox">
                <input
                  type="checkbox"
                  id="infoRequirementMarketing"
                  checked={gift.fromPhotographyPermissionGiven}
                  onChange={evt =>
                    setGift({
                      ...gift,
                      fromPhotographyPermissionGiven: evt.target.checked,
                    })
                  }
                />
                <label htmlFor="infoRequirementMarketing">
                  {intl.formatMessage({ id: "infoRequirementMarketing" })}{" "}
                </label>
              </div>
            </div>
          </div>
          <NextButton
            to="/to"
            text={intl.formatMessage({ id: "infoButtonNext" })}
            disabled={!attendanceAccepted || !gdprAccepted}
          />
          <BackButton to="/" text={intl.formatMessage({ id: "backButton" })} />
        </div>
      </main>
    </Layout>
  )
}

export default InfoPage
