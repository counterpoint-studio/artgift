import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import BackButton from "../components/backButton"

import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { MAP_INIT_CENTER, REGION_BOUNDING_BOX } from "../constants"

import { useMounted } from "../hooks"

import "./info.scss"

const InfoPage: React.FC<PageProps> = () => {
  let mounted = useMounted()
  let intl = useIntl()
  let { isMoving: isMapMoving } = useMapBackground({
    initPoint: MAP_INIT_CENTER,
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: 150,
    regions: undefined,
  })

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
              <label>
                <input type="checkbox" />
                {intl.formatMessage({ id: "infoRequirementAttendance" })}{" "}
                <span className="requiredField">*</span>
              </label>
            </div>
            <div className="inputGroup">
              <label>
                <input type="checkbox" />
                {intl.formatMessage({ id: "infoRequirementMarketing" })}{" "}
                <span className="requiredField">*</span>
              </label>
            </div>
            <div className="inputGroup">
              <label>
                <input type="checkbox" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({ id: "infoRequirementTerms" }),
                  }}
                ></span>{" "}
                <span className="requiredField">*</span>
              </label>
            </div>
            <div className="inputGroup">
              <label>
                <input type="checkbox" />
                {intl.formatMessage({ id: "infoRequirementGDPR" })}{" "}
                <span className="requiredField">*</span>
              </label>
            </div>
            <NextButton
              to="/to"
              text={intl.formatMessage({ id: "infoButtonNext" })}
            />
            <BackButton
              to="/"
              text={intl.formatMessage({ id: "backButton" })}
            />
          </div>
        </div>
      </main>
    </Layout>
  )
}

export default InfoPage
