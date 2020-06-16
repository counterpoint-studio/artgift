import React from "react"
import { useIntl, Link } from "gatsby-plugin-intl"

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
    </footer>
  )
}

export default Footer
