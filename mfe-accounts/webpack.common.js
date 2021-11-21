//const mfeWebpackConfiguration = require('@mfe-core/tools/webpack/mfe-remote.webpack.common.js');
const { mfeAccounts } = require("mfe-core/module.config.js");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const path = require('path');

const mfeName = mfeAccounts.name;

const deps = require("./package.json").dependencies;

//module.exports = mfeWebpackConfiguration(mfeAccounts.name, deps);

module.exports = {
    entry: './src/index',
    output: {
        publicPath: "auto",
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react', '@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-runtime'],
                    },
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        new webpack.ProvidePlugin({
            "React": "react",
        }),
        new ModuleFederationPlugin(
            {
                name: mfeName,
                filename: 'remoteEntry.js',
                exposes: {
                    './App': './src/App',
                },
                shared: {
                    react: {
                        singleton: true,
                        eager: true,
                        requiredVersion: deps.react
                    },
                    "react-dom": {
                        singleton: true,
                        eager: true,
                        requiredVersion: deps['react-dom']
                    }
                },
            }
        )
    ]
}