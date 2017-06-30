const webpack = require('webpack');
const path = require('path');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const AssetsPlugin = require('assets-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');

const postcss = require('postcss');
const postcssSmartImport = require('postcss-smart-import');
const precss = require('precss');
const autoprefixer = require('autoprefixer');


const DIRNAME = process.cwd();
const CFG = require('./common.js');
const registRule = require('./rules.js');

let config = {
    entry: {},
    output: {
        path: path.resolve(DIRNAME, CFG.dist),
        filename: path.join(CFG.Resource.jsDist, CFG.Resource.jsName).replace(/\\/g, '/'),
        library: '[name]_library',
    },
    module: {
        rules: [
            registRule.js(),
            registRule.vue({ sourceMap: CFG.DEV, extract: true, modules: true, src: CFG.src, minimize: !CFG.DEV }), //langs: ['less','sass','css'],
            registRule.css({ sourceMap: CFG.DEV, extract: true, modules: false, src: CFG.src, minimize: !CFG.DEV }),
            registRule.less({ sourceMap: CFG.DEV, extract: true, modules: false, src: CFG.src, minimize: !CFG.DEV }),
            registRule.asset(),
            registRule.file(),
            registRule.html({ minimize: !CFG.DEV }),
        ]
    },
    resolve: CFG.Resolve,
    devtool: CFG.Devtool,
    plugins: [
        new webpack.DllPlugin({
            path: path.join(DIRNAME, CFG.dist, CFG.dllName),
            name: '[name]_library',
        }),
        new ExtractTextPlugin({
            filename: path.join(CFG.Resource.cssDist, CFG.Resource.cssName).replace(/\\/g, '/'),
            allChunks: true
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: false,
            },
            sourceMap: CFG.DEV
        }),
        new AssetsPlugin({
            filename: path.join('config', CFG.dllName),
        }),
    ]
}

if (!!CFG.dll && CFG.dllType === 1) {
    config.entry = CFG.dll;
}

module.exports = config;
