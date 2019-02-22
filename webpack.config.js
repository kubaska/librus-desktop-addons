const path = require('path');
const WebExtWebpackPlugin = require('web-ext-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new WebExtWebpackPlugin({
      browserConsole: true,
      startUrl: ['https://synergia.librus.pl'],
      sourceDir: path.resolve(__dirname, 'dist'),
    }),
    new CopyPlugin([
      { from: 'assets', to: 'assets' },
      { from: 'manifest.src.json', to: 'manifest.json' }
    ])
  ],

  mode: 'development',
  devtool: 'source-map',

  entry: {
    'lda-lessons': './src/lessons.js',
    'lda-options': './src/options.js'
  }
};