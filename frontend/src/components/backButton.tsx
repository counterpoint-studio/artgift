import React from "react"
import { navigate as intlNavigate } from "gatsby-plugin-intl"
import { navigate } from "gatsby"

import "./backButton.scss"

interface BackButtonProps {
  text: string
  to?: string
}
const BackButton: React.FC<BackButtonProps> = ({ text, to }) => (
  <button
    onClick={() => (to ? intlNavigate(to) : navigate(-1))}
    className="button button--back"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.96 14">
      <path d="M23.88,7.38a.92.92,0,0,0,0-.76,1,1,0,0,0-.21-.33l-6-6a1,1,0,0,0-1.42,1.42L20.55,6H1A1,1,0,0,0,1,8H20.55l-4.3,4.29a1,1,0,0,0,0,1.42A1,1,0,0,0,17,14a1,1,0,0,0,.71-.29l6-6A1,1,0,0,0,23.88,7.38Z" />
    </svg>
    {text}
  </button>
)

export default BackButton
