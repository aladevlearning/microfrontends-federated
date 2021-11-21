const mfeWebpackConfiguration = require('../mfe-utils/webpack/mfe-remote.webpack.common.js')
const { mfePayments } = require("../mfe-utils/module.config");
const deps = require("./package.json").dependencies;

module.exports = mfeWebpackConfiguration(mfePayments.name, deps);