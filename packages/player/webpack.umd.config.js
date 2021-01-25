const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    library: 'webplayer',
    libraryExport: 'default',
    libraryTarget: 'umd',
    filename: 'webplayer.min.js',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'webplayer.css',
    }),
    // disable dynamic imports, it doesn't work with the umd output
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
};
