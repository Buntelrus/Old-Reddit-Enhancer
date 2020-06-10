const path = require("path")
const common = require("./webpack.common")
const merge = require("webpack-merge")
const WebpackUserscript = require('webpack-userscript')
const userscriptOptions = require('./userscript.plugin.common.options')

module.exports = merge(common, {
  output: {
    filename: "[name].bundle.min.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new WebpackUserscript(userscriptOptions)
  ]
});
