import React from "react"
import { useIntl, Link } from "gatsby-plugin-intl"

import HelsinginSanomatLogo from "../images/helsingin-sanomat.svg"
import "./footer.scss"

const Footer = () => {
  let intl = useIntl()

  return (
    <footer className="footer">
      <Link to="/privacy" className="footerLink footerLink--privacy">
        {intl.formatMessage({ id: "privacyLink" })}
      </Link>
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
