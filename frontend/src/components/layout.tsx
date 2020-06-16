import React from "react"

import Header from "../components/header"
import Footer from "../components/footer"

import "./layout.scss"

const Layout = ({ children }) => {
  return (
    <div className="content">
      <Header />
      {children}
      <Footer />
    </div>
  )
}

export default Layout
