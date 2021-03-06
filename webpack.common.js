const webpack = require('webpack')
const package = require('./package.json')
const dev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: dev? "development": "production",

  entry: {
    main: "./app/index.js",
  },
  module: {
    rules: [{
      test: /\.scss$/,
      exclude: /node_modules/,
      use: [
        "style-loader", //3. Inject styles into DOM
        "css-loader", //2. Turns css into commonjs
        "sass-loader" //1. Turns sass into css
      ]
    }, {
      test: /\.html$/,
      exclude: /node_modules/,
      use: {
        loader: 'html-loader'
      }
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(package.version)
    })
  ]
}
