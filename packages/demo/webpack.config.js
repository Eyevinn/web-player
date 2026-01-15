const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');

const package = require('./package.json');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'demo.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: package.dependencies["@eyevinn/web-player"].replace("^", ''),
      template: './src/template.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: './src/logo-darkmode.png', to: 'logo-darkmode.png' },
        { from: './src/logo-lightmode.png', to: 'logo-lightmode.png' },
        { from: './src/style.css', to: 'style.css' },
      ],
    }),
    new EnvironmentPlugin({
      ICE_SERVERS: 'DEFAULT',
      CLOUDFLARE_BETA: 'false',
      ANALYTICS_URL: 'https://eyevinnlab-epasdev.eyevinn-player-analytics-eventsink.auto.prod.osaas.io'
    }),
  ],
  resolve: {
    mainFields: ['module', 'main'],
    fallback: {
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      url: false,
      fs: false,
      http: false,
      https: false
    }
  },
  devtool: 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 1337,
    host: '0.0.0.0',
  },
  stats: {
    warningsFilter: [/Failed to parse source map/],
  },
};
