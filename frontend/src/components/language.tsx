import React from "react"
import { IntlContextConsumer, changeLocale } from "gatsby-plugin-intl"
import classNames from "classnames"

import "./language.scss"

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
            {language}
          </a>
        ))
      }
    </IntlContextConsumer>
  </div>
)

export default Language
