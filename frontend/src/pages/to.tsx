import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"

import "./to.scss"

const ToPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "toSEOTitle" })}
        description={intl.formatMessage({ id: "toSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "to",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--to">
        <form>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelFor" })}:</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelAddress" })}:</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelLanguage" })}:</label>
            <select>
              <option>
                {intl.formatMessage({ id: "toFormLabelLanguageFi" })}
              </option>
              <option>
                {intl.formatMessage({ id: "toFormLabelLanguageEn" })}
              </option>
              <option>
                {intl.formatMessage({ id: "toFormLabelLanguageSe" })}
              </option>
            </select>
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelMessage" })}:</label>
            <textarea></textarea>
          </div>
          <NextButton
            to="/gifts"
            text={intl.formatMessage({ id: "toButtonNext" })}
          />
        </form>
      </div>
    </Layout>
  )
}

export default ToPage
