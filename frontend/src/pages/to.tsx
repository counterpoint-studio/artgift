import React, { useState, useCallback } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import AutoSuggest from "react-autosuggest"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import * as addresses from "../services/streetAddressLookup"

import "./to.scss"

const ToPage = () => {
  let intl = useIntl()
  let [address, setAddress] = useState("f")
  let [addressSuggestions, setAddressSuggestions] = useState<string[]>([])

  let onLoadAddressSuggestions = useCallback((address: string) => {
    if (address.length > 0) {
      addresses.findAddresses(address).then(setAddressSuggestions)
    } else {
      setAddressSuggestions([])
    }
  }, [])
  let onClearAddressSuggestions = useCallback(() => {
    setAddressSuggestions([])
  }, [])
  console.log(address)

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "toSEOTitle" })}
        description={intl.formatMessage({ id: "toSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "to",
        }}
        key="helmet"
      />
      <div className="pageContent pageContent--to">
        <main className="main">
          <form>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelFor" })}:</label>
              <input type="text" />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelAddress" })}:</label>
              <AutoSuggest
                suggestions={addressSuggestions}
                onSuggestionsFetchRequested={evt =>
                  onLoadAddressSuggestions(evt.value)
                }
                onSuggestionsClearRequested={onClearAddressSuggestions}
                getSuggestionValue={v => v}
                renderSuggestion={v => v}
                inputProps={{
                  value: address,
                  onChange: (_, { newValue }) => setAddress(newValue),
                }}
              />
            </div>
            <div className="inputGroup">
              <label>
                {intl.formatMessage({ id: "toFormLabelLanguage" })}:
              </label>
              <select>
                <option>
                  {intl.formatMessage({ id: "toFormLabelLanguageFi" })}
                </option>
                <option>
                  {intl.formatMessage({ id: "toFormLabelLanguageEn" })}
                </option>
                <option>
                  {intl.formatMessage({ id: "toFormLabelLanguageSe" })}
                </option>
              </select>
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelMessage" })}:</label>
              <textarea></textarea>
            </div>
            <NextButton
              to="/gifts"
              text={intl.formatMessage({ id: "toButtonNext" })}
            />
          </form>
        </main>
      </div>
    </Layout>
  )
}

export default ToPage
