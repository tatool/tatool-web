const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  mode: 'production',
  module: {
    rules: [{
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: 'css-loader',
        publicPath: '../'
      })
    }, {
      test: /\.(eot|svg|ttf|woff|woff2)$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: './styles/fonts/'
          //publicPath: '../'
        }
      }]
    }]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ExtractTextPlugin('./styles/[name].css'),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    })
  ]
});