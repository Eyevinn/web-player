const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    library: 'webplayer.component',
    libraryExport: 'default',
    libraryTarget: 'umd',
    filename: 'web-player.component.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: package.dependencies["@eyevinn/web-player"].replace("^", ''),
      template: './src/index.html',
    }),
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: './src',
    compress: true,
    port: 1338,
    host: '0.0.0.0',
  },
  stats: {
    warningsFilter: [/Failed to parse source map/],
  },
};
