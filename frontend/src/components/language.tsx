import React from "react"
import { IntlContextConsumer, changeLocale } from "gatsby-plugin-intl"
import classNames from "classnames"

import "./language.scss"

const languageName = {
  en: "En",
  fi: "Fi",
}

const Language = () => (
  <div className="language">
    <IntlContextConsumer>
      {({ languages, language: currentLocale }) =>
        languages.map(language => (
          <a
            className={classNames("languageLink", {
              isCurrent: currentLocale === language,
            })}
            key={language}
            onClick={() => changeLocale(language)}
          >
            {languageName[language]}
          </a>
        ))
      }
    </IntlContextConsumer>
  </div>
)

export default Language
