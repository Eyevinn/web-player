const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');
const webpack = require('webpack');

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
      title: package.version,
      template: './src/index.html',
    }),
    // disable dynamic imports, it doesn't work with the umd output
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  devtool: 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 1338,
    host: '0.0.0.0',
  },
  stats: {
    warningsFilter: [/Failed to parse source map/],
  },
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify")
    }
  }
};
