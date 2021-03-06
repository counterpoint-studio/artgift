import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import BackButton from "../components/backButton"

import "./page.scss"

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
          class: "page privacy",
        }}
        key="helmet"
      />
      <main className="main isVisible">
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "privacyTitle" })}</h1>
          <div
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: "privacyContent" }),
            }}
          ></div>
        </div>
        <div className="pageFooter">
          <BackButton to="/" text={intl.formatMessage({ id: "backButton" })} />
        </div>
      </main>
    </Layout>
  )
}

export default PrivacyPage
