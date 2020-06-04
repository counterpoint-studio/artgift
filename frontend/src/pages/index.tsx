import React from "react"
import { useIntl } from "gatsby-plugin-intl"
import firebase from "gatsby-plugin-firebase"

import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = () => {
  let intl = useIntl()

  // Just for testing Firebase connection
  React.useEffect(() => {
    firebase
      .firestore()
      .collection("/timeslots")
      .get()
      .then(snapshot => {
        console.log(snapshot)
      })
  }, [])

  return (
    <Layout>
      <SEO title="Home" />
      <h1>{intl.formatMessage({ id: "title" })}</h1>
    </Layout>
  )
}

export default IndexPage
