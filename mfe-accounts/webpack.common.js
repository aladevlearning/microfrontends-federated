const mfeWebpackConfiguration = require('mfe-core/devtools/webpack.mfe-remote.common.js');

const { mfeAccounts } = require("mfe-core/module.config.js");
const deps = require("./package.json").dependencies;

module.exports = mfeWebpackConfiguration(mfeAccounts.name, deps);
