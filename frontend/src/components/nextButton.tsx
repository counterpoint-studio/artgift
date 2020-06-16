import React from "react"
import { Link } from "gatsby-plugin-intl"
import classNames from "classnames"

import "./nextButton.scss"

interface NextButtonProps {
  text: string
  to: string
  disabled?: boolean
}
const NextButton: React.FC<NextButtonProps> = ({ text, to, disabled }) => (
  <Link to={to} className={classNames("button", "button--next", { disabled })}>
    {text}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.96 14">
      <path
        fill="white"
        d="M23.88,7.38a.92.92,0,0,0,0-.76,1,1,0,0,0-.21-.33l-6-6a1,1,0,0,0-1.42,1.42L20.55,6H1A1,1,0,0,0,1,8H20.55l-4.3,4.29a1,1,0,0,0,0,1.42A1,1,0,0,0,17,14a1,1,0,0,0,.71-.29l6-6A1,1,0,0,0,23.88,7.38Z"
      />
    </svg>
  </Link>
)

export default NextButton
