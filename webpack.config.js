const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: {
    'tatool-app': './app/scripts/modules/app.module.js',
    'tatool-module': './app/scripts/modules/module.module.js'
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          enforce: true,
          chunks: 'all'
        }
      }
    }
  },
  output: {
    filename: 'scripts/[name].min.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }, {
      test: /\.html$/,
      use: ['html-loader']
    }, {
      test: /\.(jpe?g|png|gif|ico)$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/'
        }
      }]
    }, {
      test: /\.txt$/,
      use: ['raw-loader']
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['tatool-app', 'vendor'],
      filename: 'index.html',
      template: 'app/index-template.html'
    }), new HtmlWebpackPlugin({
      inject: true,
      chunks: ['tatool-module', 'vendor'],
      filename: 'moduleIndex.html', //views/module/index.html
      template: 'app/views/module/index-template.html'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
    //,new BundleAnalyzerPlugin()
  ]
};