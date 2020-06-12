import React from "react"

import Header from "../components/header"

import "./layout.scss"

const Layout = ({ children }) => {
  return (
    <div className="content">
      <Header />
      {children}
    </div>
  )
}

export default Layout
