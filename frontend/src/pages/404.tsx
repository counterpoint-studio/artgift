import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"

const NotFoundPage = () => {
  let intl = useIntl()
  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "404SEOTitle" })}
        description={intl.formatMessage({ id: "404SEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "404",
        }}
        key="helmet"
      />
      <main className="main">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "404Title" })}</h1>
          <p>{intl.formatMessage({ id: "404Body" })}</p>
          <NextButton to="/" text={intl.formatMessage({ id: "homeButton" })} />
        </div>
      </main>
    </Layout>
  )
}

export default NotFoundPage
