const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  mode: 'development',
  devServer: {
    static: {
            directory: path.resolve(__dirname, 'dist'),
            publicPath: '/dist'
        },
    historyApiFallback: true,
    hot: true,
    proxy: [{
      context: ['/mode', '/api', '/user', '/developer', '/public', '/data'],
      target: 'http://localhost:3000'
    }],
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "../",
            },
          },
          "css-loader",
        ],
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "./styles/[name].css",
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: false,
    })
  ]
});