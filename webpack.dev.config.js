const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
	devtool: 'inline-source-map',
	devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    proxy: [{
      context: ["/mode", "/api", "/user", "/developer", "/public", "/data"],
      target: 'http://localhost:3000'
    }]
  },
  module: {
      rules: [
        { 
          test: /\.css$/, 
          use: ['style-loader','css-loader'] 
        },
        { 
          test: /\.(eot|svg|ttf|woff|woff2)$/, 
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'styles/fonts/'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.optimize.CommonsChunkPlugin( { name: 'vendor', filename: 'scripts/vendor.min.js'} ),
    ]
});