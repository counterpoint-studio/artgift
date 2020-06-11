import React from "react"
import Helmet from "react-helmet"
import { useIntl, Link } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

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
            <label>{intl.formatMessage({ id: "toFormLabelMessage" })}:</label>
            <textarea></textarea>
          </div>
          <Link to="/gifts" className="button button--next">
            {intl.formatMessage({ id: "toButtonNext" })}
          </Link>
        </form>
      </div>
    </Layout>
  )
}

export default ToPage
