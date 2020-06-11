import React from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"

import "./gifts.scss"

const GiftsPage = () => {
  let intl = useIntl()

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "giftsSEOTitle" })}
        description={intl.formatMessage({ id: "giftsSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "gifts",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--gifts">
        <h1>{intl.formatMessage({ id: "giftsTitle" })}</h1>
        <table className="giftsTable">
          <colgroup>
            <col className="giftsTableColumn giftsTableColumn--time" />
            <col className="giftsTableColumn giftsTableColumn--book" />
          </colgroup>
          <tbody>
            <tr>
              <td>09:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>10:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>11:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>12:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>13:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>14:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>15:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
            <tr>
              <td>16:00</td>
              <td>
                <button className="giftsTableButton giftsTableButton--book">
                  Book
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export default GiftsPage
