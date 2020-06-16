import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./privacy.scss"

const PrivacyPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "fromSEOTitle" })}
        description={intl.formatMessage({ id: "fromSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "privacy",
        }}
        key="helmet"
      />
      <main className="main">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "privacyTitle" })}</h1>
          <p>{intl.formatMessage({ id: "privacyContent" })}</p>
        </div>
      </main>
    </Layout>
  )
}

export default PrivacyPage
