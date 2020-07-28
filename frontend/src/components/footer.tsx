import React from "react"
import { useIntl } from "gatsby-plugin-intl"

import HelsinginSanomatLogo from "../images/helsingin-sanomat.svg"
import "./footer.scss"

const Footer = () => {
  let intl = useIntl()

  return (
    <footer className="footer">
      <a
        className="footerLink footerLink--helsingin-sanomat"
        href="https://www.hs.fi"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={HelsinginSanomatLogo} alt="Helsingin Sanomat" />
      </a>
    </footer>
  )
}

export default Footer
