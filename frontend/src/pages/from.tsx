import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./from.scss"

const FromPage = () => {
  let intl = useIntl()

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
      <div className="pageContent pageContent--from">
        <h1>{intl.formatMessage({ id: "fromTitle" })}</h1>
        <p>
          {intl.formatMessage({ id: "fromReservedTimeStart" })} [time]{" "}
          {intl.formatMessage({ id: "fromReservedTimeEnd" })}
        </p>
        <form>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "fromFormLabelName" })}</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "fromFormLabelPhone" })}</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "fromFormLabelEmail" })}</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "fromFormLabelSpecialInfo" })}
            </label>
            <textarea></textarea>
          </div>
          <a href="/delivery" className="button button--next">
            {intl.formatMessage({ id: "fromButtonNext" })}
          </a>
        </form>
      </div>
    </Layout>
  )
}

export default FromPage
