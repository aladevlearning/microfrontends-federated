const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfeShell } = require("mfe-core/module.config.js");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfeShell.port,
        historyApiFallback: true
    },
    devtool: 'source-map',
});