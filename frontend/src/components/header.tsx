import React from "react"
import { useIntl } from "gatsby-plugin-intl"

import Logo from "../images/logo.svg"

import "./header.scss"

const Header = () => {
  let intl = useIntl()

  return (
    <header className="header">
      <img
        className="logo"
        src={Logo}
        alt={intl.formatMessage({ id: "title" })}
      />
    </header>
  )
}

export default Header
