const webpack = require('webpack')
const merge = require('webpack-merge')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  plugins: [
    // new UglifyJsPlugin({
    //   uglifyOptions: {
    //     ecma: 8,
    //     compress: true
    //   }
    // }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false,
    //   },
    //   comments: false,
    // }),
    // new webpack.optimize.AggressiveMergingPlugin(),
  ],
  // new webpack.optimize.UglifyJsPlugin()
  performance: {
    hints: false
  }
})