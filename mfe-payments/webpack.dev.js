const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfePayments } = require("../mfe-utils/module.config");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfePayments.port,
    },
    devtool: 'source-map',
});