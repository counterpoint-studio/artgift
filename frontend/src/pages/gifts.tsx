import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl, Link } from "gatsby-plugin-intl"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { subscribeToGiftSlotsInRegion, GiftSlot } from "../services/gifts"

import "./gifts.scss"

const GiftsPage = () => {
  let intl = useIntl()
  let region = "ETELÄINEN"
  let [slots, setSlots] = useState<GiftSlot[]>([])

  useEffect(() => {
    let unSub = subscribeToGiftSlotsInRegion(region, setSlots)
    return () => {
      unSub()
    }
  }, [region])

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
        <h1>
          {intl.formatMessage({ id: "giftsTitle" })} {region}
        </h1>
        <table className="giftsTable">
          <tbody>
            {slots.map(slot => (
              <tr key={slot.id}>
                <td className="giftsTableTime">{formatTime(slot.time)}</td>
                <td className="giftsTableBook">
                  <Link to="/from" className="button button--book">
                    {intl.formatMessage({ id: "giftsButtonBook" })}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

function formatTime(time: string) {
  let [hours, minutes] = time.split(":").map(t => +t)
  let h = hours < 10 ? `0${hours}` : `${hours}`
  let m = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${h}:${m}`
}

export default GiftsPage
