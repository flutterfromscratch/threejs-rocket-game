const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
    // externals: [
    //     ({ context, request }, callback) => {
    //         if (request.toLowerCase() === 'three' || request.endsWith('three.module.js')) {
    //             return callback(null, {
    //                 commonjs: 'three',
    //                 commonjs2: 'three',
    //                 amd: 'three',
    //                 root: 'THREE'
    //             })
    //         }
    //         callback()
    //     }
    // ],
    plugins: [
        new HtmlWebpackPlugin({
            template: 'html/index.html'
        }),
        new CopyPlugin({
            patterns: [
                {from: 'static', to: 'static'}
            ]
        }),
        // new BundleAnalyzerPlugin(),

    ],
    entry: './game.ts',
    module: {
        rules: [
            {test: /\.(glsl|vs|fs|vert|frag)$/, exclude: /node_modules/, use: ['raw-loader']},
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }

        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

}
