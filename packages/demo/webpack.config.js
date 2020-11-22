const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
      template: './src/template.html',
    }),
    new CopyPlugin({
      patterns: [{ from: './src/logo.png', to: 'logo.png' }],
      patterns: [{ from: './src/style.css', to: 'style.css' }],
    }),
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: './src',
    compress: true,
    port: 1337,
    host: '0.0.0.0',
  },
};
