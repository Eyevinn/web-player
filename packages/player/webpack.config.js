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
    path: path.resolve(__dirname, 'dist'),
    globalObject: 'this'
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
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify")
    }
  }
};
