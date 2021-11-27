const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const path = require('path');

module.exports = (mfeName, deps) => {
    return {
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
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    type: 'asset/resource'
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
            ]
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
}