const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfePayments } = require("mfe-core/module.config.js");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfePayments.port,
        historyApiFallback: true
    },
    devtool: 'source-map',
});