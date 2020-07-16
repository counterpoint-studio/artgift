import React, { useMemo, useState, useEffect, useCallback } from "react"
import Helmet from "react-helmet"
import { useIntl, IntlShape, navigate } from "gatsby-plugin-intl"
import classNames from "classnames"
import { Textbox } from "react-inputs-validation"
import emailValidator from "email-validator"

import Layout from "../components/layout"
import SEO from "../components/seo"
import NextButton from "../components/nextButton"
import BackButton from "../components/backButton"

import { useMounted, useGiftState } from "../hooks"
import { getRegionGeoJSON } from "../services/regionLookup"
import { useMapBackground } from "../../plugins/gatsby-plugin-map-background/hooks"
import { REGION_BOUNDING_BOX, PHONE_NUMBER_REGEX } from "../constants"
import { getGiftSlot, initGift, saveGift } from "../services/gifts"
import { GiftSlot } from "../types"
import { formatTime, formatDate, formatDuration } from "../services/dates"

import "./from.scss"

const emptyPoints = []

const FromPage = () => {
  let intl = useIntl()
  let mounted = useMounted()
  let regions = useMemo(() => getRegionGeoJSON(), [])
  let [gift, setGift] = useGiftState(initGift(intl.locale))
  let [giftSlot, setGiftSlot] = useState<GiftSlot>()
  let [reservedFor, setReservedFor] = useState<number>()

  let isValid =
    validateName(gift.fromName, intl) === true &&
    validateEmail(gift.fromEmail, intl) === true &&
    validatePhoneNumber(gift.fromPhoneNumber, intl) === true

  useEffect(() => {
    if (!gift.slotId) {
      navigate("/")
    } else if (gift.status === "pending") {
      navigate("/delivery")
    }
  }, [gift])

  useEffect(() => {
    if (gift.slotId) {
      getGiftSlot(gift.slotId).then(setGiftSlot)

      let intv = setInterval(() => {
        if (gift.reservedUntil && gift.reservedUntil > Date.now()) {
          setReservedFor(gift.reservedUntil - Date.now())
        } else {
          navigate("/gifts", { state: { reservationExpired: true } })
        }
      }, 100)

      return () => {
        clearInterval(intv)
      }
    }
  }, [gift?.slotId])

  let { isMoving: isMapMoving } = useMapBackground({
    bounds: gift.toLocation
      ? boundsAround(gift.toLocation.point)
      : REGION_BOUNDING_BOX,
    boundsPadding: 0,
    regions,
    points: emptyPoints,
    focusPoint: gift.toLocation && {
      className: "fromPage",
      location: gift.toLocation.point,
    },
  })

  let doReserveGift = useCallback(async () => {
    setGift(await saveGift({ ...gift, status: "pending" }))
  }, [gift])

  return (
    <Layout>
      <SEO
        title={intl.formatMessage({ id: "fromSEOTitle" })}
        description={intl.formatMessage({ id: "fromSEODescription" })}
      />
      <Helmet
        bodyAttributes={{
          class: "from",
        }}
        key="helmet"
      />
      <main
        className={classNames("main", {
          isVisible: mounted && !isMapMoving,
        })}
      >
        <div className="scroll">
          <h1>{intl.formatMessage({ id: "fromTitle" })}</h1>
          <p>
            {intl.formatMessage({ id: "fromGiftDate" })}{" "}
            {giftSlot && (
              <>
                {formatDate(giftSlot.date, intl)}{" "}
                {intl.formatMessage({ id: "fromGiftTime" })}{" "}
                {formatTime(giftSlot.time)}
              </>
            )}{" "}
            {intl.formatMessage({ id: "fromReservedTimeStart" })}{" "}
            <span className="countdownTimer">
              {formatDuration(reservedFor)}
            </span>
          </p>
          <p>{intl.formatMessage({ id: "fromReservedTimeEnd" })}</p>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "fromFormLabelName" })}
              <span className="requiredField">*</span>
            </label>
            <Textbox
              maxLength={50}
              value={gift.fromName}
              onChange={name => setGift({ ...gift, fromName: name })}
              onBlur={() => {}}
              validationOption={{
                required: false,
                customFunc: v => validateName(v, intl),
              }}
            />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "fromFormLabelPhone" })}
              <span className="requiredField">*</span>
            </label>
            <Textbox
              attributesInput={{
                type: "tel",
              }}
              maxLength={25}
              value={gift.fromPhoneNumber}
              onChange={phone => setGift({ ...gift, fromPhoneNumber: phone })}
              onBlur={() => {}}
              validationOption={{
                required: false,
                customFunc: v => validatePhoneNumber(v, intl),
              }}
            />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "fromFormLabelEmail" })}
              <span className="requiredField">*</span>
            </label>
            <Textbox
              attributesInput={{
                type: "email",
              }}
              value={gift.fromEmail}
              onChange={email => setGift({ ...gift, fromEmail: email })}
              onBlur={() => {}}
              validationOption={{
                required: false,
                customFunc: v => validateEmail(v, intl),
              }}
            />
          </div>
          <div className="inputGroup">
            <label>
              {intl.formatMessage({ id: "fromFormLabelSpecialInfo" })}
            </label>
            <textarea
              maxLength={1000}
              value={gift.fromMessage}
              onChange={evt =>
                setGift({ ...gift, fromMessage: evt.currentTarget.value })
              }
            ></textarea>
          </div>
          <NextButton
            to="/delivery"
            text={intl.formatMessage({ id: "fromButtonNext" })}
            disabled={!isValid}
            onClick={evt => {
              evt.preventDefault()
              evt.stopPropagation()
              doReserveGift()
            }}
          />
          <BackButton
            to="/gifts"
            text={intl.formatMessage({ id: "backButton" })}
          />
        </div>
      </main>
    </Layout>
  )
}

function validateName(name: string, intl: IntlShape) {
  if (name.trim().length === 0) {
    return intl.formatMessage({ id: "validationErrorEmpty" })
  } else {
    return true
  }
}

function validatePhoneNumber(phone: string, intl: IntlShape) {
  if (phone.trim().length === 0) {
    return intl.formatMessage({ id: "validationErrorEmpty" })
  } else if (!PHONE_NUMBER_REGEX.test(phone.replace(/\s/g, ""))) {
    return intl.formatMessage({
      id: "validationErrorInvalidPhoneNumber",
    })
  } else {
    return true
  }
}

function validateEmail(email: string, intl: IntlShape) {
  if (email.trim().length === 0) {
    return intl.formatMessage({ id: "validationErrorEmpty" })
  } else if (!emailValidator.validate(email)) {
    return intl.formatMessage({
      id: "validationErrorInvalidEmail",
    })
  } else {
    return true
  }
}

function boundsAround([lng, lat]: [number, number]) {
  return [
    [lng - 0.002, lat - 0.002],
    [lng + 0.002, lat + 0.002],
  ]
}

export default FromPage
