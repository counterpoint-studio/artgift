import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"

import Logo from "../images/imagePlaceholder.svg"

import "./index.scss"

const IntroPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "introSEOTitle" })}
        description={intl.formatMessage({ id: "introSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "intro",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--intro">
        <Language />
        <img
          className="introLogo"
          src={Logo}
          alt={intl.formatMessage({ id: "title" })}
        />
        <h1 className="introTitle">
          {intl.formatMessage({ id: "introTitle" })}
        </h1>
        <div className="introBody">
          <p>{intl.formatMessage({ id: "introBody" })}</p>
        </div>
        <a href="/to" className="button button--next">
          {intl.formatMessage({ id: "introButtonNext" })}
        </a>
      </div>
    </Layout>
  )
}

export default IntroPage
