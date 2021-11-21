const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfeAccounts } = require("../mfe-utils/module.config");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfeAccounts.port,
    },
    devtool: 'source-map',
});