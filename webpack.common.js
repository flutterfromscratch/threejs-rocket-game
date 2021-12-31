const path = require('path')

module.exports = {
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
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist'),
    },
}
