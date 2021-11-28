const mfeWebpackConfiguration = require('@aladevlearning/core/devtools/webpack.mfe-remote.common.js');

const { mfeAccounts } = require("@aladevlearning/core/module.config.js");
const deps = require("./package.json").dependencies;

const path = require('path');

module.exports = mfeWebpackConfiguration(
    mfeAccounts,
    path.resolve(__dirname, 'dist'),
    deps
);