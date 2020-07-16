import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"

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
          <div
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: "privacyContent" }),
            }}
          ></div>
        </div>
        <BackButton text={intl.formatMessage({ id: "backButton" })} />
      </main>
    </Layout>
  )
}

export default PrivacyPage
