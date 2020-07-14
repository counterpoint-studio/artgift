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
      <Link to="/terms" className="footerLink footerLink--terms">
        {intl.formatMessage({ id: "termsLink" })}
      </Link>
      <img
        src={HelsinginSanomatLogo}
        alt="Helsingin Sanomat"
        className="footerLink footerLink--helsingin-sanomat"
      />
    </footer>
  )
}

export default Footer
