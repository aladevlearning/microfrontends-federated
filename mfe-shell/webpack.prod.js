const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { mfeShell } = require("../mfe-utils/module.config");

module.exports = merge(common, {
    mode: 'production'
});