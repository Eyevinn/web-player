const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
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
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: './src',
    compress: true,
    port: 1337,
    host: '0.0.0.0',
  },
  stats: {
    warningsFilter: [/Failed to parse source map/],
  },
};
