const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfeAccounts } = require("mfe-core/module.config.js");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfeAccounts.port
    },
    devtool: 'source-map',
});