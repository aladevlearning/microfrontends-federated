const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfeShell } = require("../mfe-utils/module.config");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: mfeShell.port,
    },
    devtool: 'source-map',
});