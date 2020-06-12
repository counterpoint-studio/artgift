import React, { useState, useCallback, useMemo } from "react"
import Helmet from "react-helmet"
import { useIntl } from "gatsby-plugin-intl"
import AutoSuggest from "react-autosuggest"
import { useDebounceCallback } from "@react-hook/debounce"
import classNames from "classnames"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import * as addresses from "../services/streetAddressLookup"

import "./to.scss"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX, INIT_GIFT } from "../constants"
import { useMounted, useGiftState } from "../hooks"
import { getRegionGeoJSON } from "../services/regionLookup"

const ToPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: 0,
    regions,
  })
  let [gift, setGift] = useGiftState(INIT_GIFT)
  let [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  let [suggestionSelected, setSuggestionSelected] = useState(false)

  let onUpdateAddress = useCallback((address: string) => {
    setGift({ ...gift, toAddress: address })
    if (address.trim().length === 0) {
      setSuggestionSelected(false)
    }
  }, [])
  let onLoadAddressSuggestions = useDebounceCallback(
    useCallback(
      (address: string) => {
        if (
          address.length > 0 &&
          !/\d/.test(address) &&
          (!suggestionSelected || address.length < 4)
        ) {
          addresses.findAddresses(address).then(setAddressSuggestions)
        } else {
          setAddressSuggestions([])
        }
      },
      [suggestionSelected]
    ),
    300
  )
  let onClearAddressSuggestions = useCallback(() => {
    setAddressSuggestions([])
  }, [])
  let onSelectSuggestion = useCallback(() => {
    setSuggestionSelected(true)
  }, [])

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
      <div
        className={classNames("pageContent", "pageContent--to", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <main className="main">
          <form>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelFor" })}:</label>
              <input
                type="text"
                maxLength={50}
                value={gift.toName}
                onChange={evt =>
                  setGift({ ...gift, toName: evt.currentTarget.value })
                }
              />
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelAddress" })}:</label>
              <AutoSuggest
                suggestions={addressSuggestions}
                getSuggestionValue={v => v}
                renderSuggestion={v => v}
                inputProps={{
                  value: gift.toAddress,
                  onChange: (_, { newValue }) => onUpdateAddress(newValue),
                }}
                onSuggestionsFetchRequested={evt =>
                  onLoadAddressSuggestions(evt.value)
                }
                onSuggestionsClearRequested={onClearAddressSuggestions}
                onSuggestionSelected={onSelectSuggestion}
              />
            </div>
            <div className="inputGroup">
              <label>
                {intl.formatMessage({ id: "toFormLabelLanguage" })}:
              </label>
              <select
                value={gift.toLanguage}
                onChange={evt =>
                  setGift({ ...gift, toLanguage: evt.target.value })
                }
              >
                <option value="fi">
                  {intl.formatMessage({ id: "toFormLabelLanguageFi" })}
                </option>
                <option value="en">
                  {intl.formatMessage({ id: "toFormLabelLanguageEn" })}
                </option>
                <option value="se">
                  {intl.formatMessage({ id: "toFormLabelLanguageSe" })}
                </option>
              </select>
            </div>
            <div className="inputGroup">
              <label>{intl.formatMessage({ id: "toFormLabelMessage" })}:</label>
              <textarea
                maxLength={1000}
                value={gift.toSignificance}
                onChange={evt =>
                  setGift({ ...gift, toSignificance: evt.currentTarget.value })
                }
              ></textarea>
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
