const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: {
    'tatool-app': './app/scripts/modules/app.module.js',
    'tatool-module': './app/scripts/modules/module.module.js'
  },
  output: {
    filename: 'scripts/[name].min.js',
    path: path.resolve(__dirname, 'dist')
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
      test: /\.html$/i,
      loader: 'html-loader',
      options: {
        esModule: false,
      }
    }, {
      test: /\.(jpe?g|png|gif|ico)$/,
      type: 'asset/resource',
      generator: {
        filename: 'images/[name][ext]'
      }
    }, {
      test: /\.(eot|svg|ttf|woff|woff2)$/,
      type: 'asset/resource',
      generator: {
        filename: 'styles/fonts/[name][ext]'
      }
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['tatool-app', 'vendor'],
      filename: 'index.html',
      template: 'app/index-template.html',
      favicon: "app/images/app/favicon.ico"
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