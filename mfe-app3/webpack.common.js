const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const webpack = require("webpack");
const deps = require("./package.json").dependencies;


module.exports = {
    module: {
        rules: [
            {
                test: /\.m?js$/,
                type: "javascript/auto",
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                options: {
                    presets: ["@babel/preset-react"],
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource'
            },
        ],
    },
    plugins: [
        new ModuleFederationPlugin({
            name: "app3",
            filename: "remoteEntry.js",
            exposes: {
                "./App": "./src/App",
            },
            shared: [
                {
                    react: {
                        singleton: true,
                        eager: true,
                        requiredVersion: deps.react
                    }, "react-dom": {
                        singleton: true,
                        eager: true,
                        requiredVersion: deps.react
                    }
                },
                "moment",
            ],
        }),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
    ],
};
