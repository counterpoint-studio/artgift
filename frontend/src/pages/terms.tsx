import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"

import "./terms.scss"

const TermsPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "fromSEOTitle" })}
        description={intl.formatMessage({ id: "fromSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "terms",
        }}
        key="helmet"
      />
      <main className="main">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "termsTitle" })}</h1>
          <p>{intl.formatMessage({ id: "termsContent" })}</p>
        </div>
        <BackButton to="/" text={intl.formatMessage({ id: "homeButton" })} />
      </main>
    </Layout>
  )
}

export default TermsPage
