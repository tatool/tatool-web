const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  	module: {
    	rules: [
    	 	{
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
            publicPath: '../'
          })
        },
        { 
          test: /\.(eot|svg|ttf|woff|woff2)$/, 
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: './styles/fonts/'
                //publicPath: '../'
              }
            }
          ]
        }
    	]
  	},
  	plugins: [
      new CleanWebpackPlugin(['dist']),
      new ExtractTextPlugin('./styles/[name].css'),
      new webpack.optimize.CommonsChunkPlugin( { name: 'vendor', filename: 'scripts/vendor.min.js'} ),
      new UglifyJsPlugin({
        test: /\.js($|\?)/i,
        sourceMap: true
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
      })
    ]
});