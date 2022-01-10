const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');
const ThreeMinifierPlugin = require("@yushijinhun/three-minifier-webpack");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const threeMinifier = new ThreeMinifierPlugin();


module.exports = merge(common, {
    plugins: [
        threeMinifier,
        new CleanWebpackPlugin()
    ],
    resolve: {
        plugins: [
            threeMinifier.resolver, // <=== (2) Add resolver on the FIRST line
        ]
    },

    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[fullhash:8].js',
        sourceMapFilename: '[name].[fullhash:8].map',
        chunkFilename: '[id].[fullhash:8].js'
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
})
