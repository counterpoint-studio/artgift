import React from "react"
import Helmet from "react-helmet"
import { useIntl, navigate } from "gatsby-plugin-intl"
import { PageProps } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import BackButton from "../components/backButton"

import "./info.scss"

const InfoPage: React.FC<PageProps> = ({ location }) => {
  let intl = useIntl()

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
      <main className="main">
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
