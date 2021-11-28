const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const path = require('path');
const { mfeShell } = require("@aladevlearning/core/module.config.js");


module.exports = {
    entry: './src/index',
    output: {
        publicPath: "auto",
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src/')
        }
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
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
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
                name: mfeShell.name,
                filename: mfeShell.fileName,
                /* 
                    Not needed here, just to list them as a reminder
                remotes: {
                     mfePayments: 'mfePayments@http://localhost:8081/remoteEntry.js',
                     mfeAccounts: 'mfeAccounts@http://localhost:8082/remoteEntry.js',
                }*/
            }
        ),
    ]
};