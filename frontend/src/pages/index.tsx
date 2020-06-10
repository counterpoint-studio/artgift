import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Language from "../components/language"

import Logo from "../images/imagePlaceholder.svg"

import "./index.scss"

const IndexPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "indexSEOTitle" })}
        description={intl.formatMessage({ id: "indexSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "index",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--index">
        <Language />
        <img
          className="indexLogo"
          src={Logo}
          alt={intl.formatMessage({ id: "title" })}
        />
        <h1 className="indexTitle">
          {intl.formatMessage({ id: "indexTitle" })}
        </h1>
        <div className="indexBody">
          <p>{intl.formatMessage({ id: "indexBody" })}</p>
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage
