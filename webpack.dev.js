const path = require("path")
const common = require("./webpack.common")
const merge = require("webpack-merge")
const WebpackUserscript = require('webpack-userscript')
const userscriptOptions = require('./userscript.plugin.common.options')

module.exports = merge(common, {
  devtool: "source-map",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    disableHostCheck: true
  },
  plugins: [
    new WebpackUserscript(merge(userscriptOptions, {
      pretty: true,
      headers: {
        version: '[version]-build.[buildNo]',
      }
    }))
  ]
});
