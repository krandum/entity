const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'awesome-typescript-loader'},
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
            { test: /\.scss$/, use: [ "style-loader", "css-loader", "sass-loader" ] }
        ]
    },
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
        }),
    ]
};