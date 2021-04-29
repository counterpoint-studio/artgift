/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

let webpack = require('webpack');

exports.onCreateWebpackConfig = ({ stage, loaders, actions, plugins }) => {
  if (stage === "build-html" || stage === "develop-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /mapbox-gl/,
            use: loaders.null(),
          },
        ],
      },
      plugins: [new webpack.IgnorePlugin({
        resourceRegExp: /^electron$/
    }),],
    })
  }
}

