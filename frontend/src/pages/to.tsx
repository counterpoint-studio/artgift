import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./to.scss"

const ForPage = () => {
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
            <label>{intl.formatMessage({ id: "toFormLabelFor" })}</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelAddress" })}</label>
            <input type="text" />
          </div>
          <div className="inputGroup">
            <label>{intl.formatMessage({ id: "toFormLabelMessage" })}</label>
            <textarea></textarea>
          </div>
          <button type="submit">{intl.formatMessage({ id: "toButtonNext" })}
      </div>
    </Layout>
  )
}

export default ForPage
