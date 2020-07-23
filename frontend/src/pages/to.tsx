import React, { useState, useCallback, useMemo, useEffect } from "react"
import Helmet from "react-helmet"
import { useIntl, IntlShape, navigate } from "gatsby-plugin-intl"
import { Textbox, Textarea } from "react-inputs-validation"
import AutoSuggest from "react-autosuggest"
import { useDebounceCallback } from "@react-hook/debounce"
import classNames from "classnames"
import { omit } from "lodash"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import BackButton from "../components/backButton"
import * as addresses from "../services/streetAddressLookup"
import * as gifts from "../services/gifts"

import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX } from "../constants"
import { useMounted, useGiftState } from "../hooks"
import { getRegionGeoJSON } from "../services/regionLookup"
import { initGift } from "../services/gifts"

import "./to.scss"

const ToPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let { isMoving: isMapMoving } = useMapBackground({
    bounds: REGION_BOUNDING_BOX,
    boundsPadding: 0,
    regions,
  })
  let [gift, setGift] = useGiftState(initGift(intl.locale))
  let [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  let [suggestionSelected, setSuggestionSelected] = useState(false)
  let [addressValidationResult, setAddressValidationResult] = useState({
    error: false,
    message: "",
  })
  let isValid =
    gift.toName.trim().length > 0 &&
    gift.toSignificance.trim().length > 0 &&
    !addressValidationResult.error

  useEffect(() => {
    if (gift.status === "pending") {
      navigate("/delivery")
    }
  }, [gift])

  let onUpdateAddressLocation = useDebounceCallback(
    useCallback(
      async (address: string) => {
        let addressLoc = await addresses.locateAddress(address, regions)
        if (addressLoc) {
          let slots = await gifts.getGiftSlotsInRegion(addressLoc.region)
          let availableSlots = slots.filter(s => s.status === "available")
          if (availableSlots.length > 0) {
            setGift(gift => ({ ...gift, toLocation: addressLoc }))
          } else {
            setAddressValidationResult({
              error: true,
              message: intl.formatMessage({
                id: "validationErrorNoGiftsInRegion",
              }),
            })
            setGift(gift => ({ ...gift, toLocation: undefined }))
          }
        } else {
          setAddressValidationResult({
            error: true,
            message: intl.formatMessage({ id: "validationErrorNotInRegion" }),
          })
          setGift(gift => ({ ...gift, toLocation: undefined }))
        }
      },
      [regions]
    ),
    400
  )

  let onUpdateAddress = useCallback(
    async (address: string) => {
      setGift(gift => ({ ...gift, toAddress: address }))
      if (address.trim().length === 0) {
        setSuggestionSelected(false)
        setAddressValidationResult({
          error: true,
          message: intl.formatMessage({ id: "validationErrorEmpty" }),
        })
      } else if (!/\d/.test(address)) {
        setAddressValidationResult({
          error: true,
          message: intl.formatMessage({
            id: "validationErrorMissingBuildingNumber",
          }),
        })
      } else {
        setAddressValidationResult({ error: false, message: "" })
        onUpdateAddressLocation(address)
      }
    },
    [regions, onUpdateAddressLocation]
  )
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
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <div className="scroll">
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "toFormLabelFor" })}
              <span className="requiredField">*</span>
            </label>
            <Textbox
              maxLength={50}
              value={gift.toName}
              onBlur={() => {}}
              onChange={name => {
                setGift({ ...gift, toName: name })
              }}
              validationOption={{
                required: false,
                customFunc: v => validateNonEmpty(v, intl),
              }}
            />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "toFormLabelAddress" })}
              <span className="requiredField">*</span>
            </label>
            <AutoSuggest
              suggestions={addressSuggestions}
              getSuggestionValue={v => v}
              renderSuggestion={v => v}
              inputProps={{
                value: gift.toAddress,
                onChange: (_, { newValue }) => onUpdateAddress(newValue),
                asyncMsgObj: addressValidationResult,
              }}
              renderInputComponent={inputProps => (
                <Textbox
                  {...omit(inputProps, "ref")}
                  value={inputProps.value}
                  onChange={(v, evt) => inputProps.onChange(evt)}
                  onBlur={evt => onUpdateAddress(evt.currentTarget.value)}
                  validationOption={{
                    required: false,
                  }}
                  asyncMsgObj={inputProps.asyncMsgObj}
                />
              )}
              onSuggestionsFetchRequested={evt =>
                onLoadAddressSuggestions(evt.value)
              }
              onSuggestionsClearRequested={onClearAddressSuggestions}
              onSuggestionSelected={onSelectSuggestion}
            />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "toFormLabelLanguage" })}
              <span className="requiredField">*</span>
            </label>
            <select
              value={gift.toLanguage}
              onChange={evt =>
                setGift(gift => ({
                  ...gift,
                  toLanguage: evt.currentTarget.value,
                }))
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
            <label>
              {intl.formatMessage({ id: "toFormLabelMessage" })}
              <span className="requiredField">*</span>
            </label>
            <Textarea
              maxLength={1000}
              value={gift.toSignificance}
              placeholder={intl.formatMessage({
                id: "toFormPlaceholderMessage",
              })}
              onBlur={() => {}}
              onChange={significance =>
                setGift(gift => ({ ...gift, toSignificance: significance }))
              }
              validationOption={{
                required: false,
                customFunc: v => validateNonEmpty(v, intl),
              }}
            />
          </div>
          <NextButton
            to="/gifts"
            text={intl.formatMessage({ id: "toButtonNext" })}
            disabled={!isValid}
          />
          <BackButton
            to="/info"
            text={intl.formatMessage({ id: "backButton" })}
          />
        </div>
      </main>
    </Layout>
  )
}

function validateNonEmpty(v: string, intl: IntlShape) {
  if (v.trim().length === 0) {
    return intl.formatMessage({ id: "validationErrorEmpty" })
  } else {
    return true
  }
}

export default ToPage
