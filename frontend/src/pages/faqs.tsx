import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"

import "./faqs.scss"

const FAQsPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "FAQsSEOTitle" })}
        description={intl.formatMessage({ id: "FAQsSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "faqs",
        }}
        key="helmet"
      />
      <main className="main isVisible">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "FAQsTitle" })}</h1>
          <div
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: "FAQsContent" }),
            }}
          ></div>
        </div>
        <BackButton text={intl.formatMessage({ id: "backButton" })} />
      </main>
    </Layout>
  )
}

export default FAQsPage
