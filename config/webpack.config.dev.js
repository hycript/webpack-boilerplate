const webpack = require('webpack');
const path = require('path');
const _ = require('lodash');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');

const WebpackAssetsManifest = require('webpack-assets-manifest');

const DIRNAME = process.cwd();
const CFG = require('./common.js');
const registPage = require('./pages.js');
const registPlugin = require('./plugins.js');
const registRule = require('./rules.js');

const sourceMap = true;
const src = CFG.src;
const exclude = CFG.Resource.cssExclude;
const include = CFG.Resource.cssExclude;
const minimize = false;
const extract = false;

let config = {
    entry: {},
    output: {
        path: path.resolve(DIRNAME, CFG.dist),
        filename: path.join(CFG.Resource.jsDist, CFG.Resource.jsName).replace(/\\/g, '/').replace('chunkhash', 'hash'),
        publicPath: CFG.publicPath,
    },
    module: {
        rules: [
            registRule.eslint({ emitError: true }),
            registRule.js(),
            registRule.vue({ sourceMap, extract, modules: true, src, minimize }), //langs: ['less','sass','css'],
            registRule.less({ sourceMap, extract, modules: true, src, exclude, minimize }),
            registRule.sass({ sourceMap, extract, modules: true, src, exclude, minimize }),
            registRule.css({ sourceMap, extract, modules: true, src, exclude, minimize }),
            /*global*/
            registRule.less({ sourceMap, extract, modules: false, src, include, minimize }),
            registRule.sass({ sourceMap, extract, modules: false, src, include, minimize }),
            registRule.css({ sourceMap, extract, modules: false, src, include, minimize }),
            registRule.asset({ limit: 2048 }),
            registRule.file({}),
            registRule.html({ minimize }),
            /*glslifyLoader*/
            registRule.glsl(),
        ]
    },
    resolve: CFG.Resolve,
    externals: {},
    devServer: {
        inline: true,
        hot: true,
        host: '0.0.0.0',
        contentBase: path.resolve(DIRNAME, CFG.dist),
        // disableHostCheck: true,
        // contentBase: path.join(DIRNAME, "dist"),
        // compress: true,
        /*if(!!module && module.hot){
            module.hot.accept();
        }*/
    },
    /*aliasesResolve: {
        '~asset': path.resolve(DIRNAME, CFG.src, 'assets'),
    },*/
    // devtool: 'inline-source-map',
    devtool: CFG.Devtool,
    plugins: [
        new ExtractTextPlugin({
            filename: path.join(CFG.Resource.cssDist, CFG.Resource.cssName).replace(/\\/g, '/'),
            allChunks: true
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
};

config.entry = CFG.Entry;

if (CFG.dllType === 2) {
    _.forEach(CFG.dll, function (value, key) {
        config.entry[key] = value;
    })
}


if (CFG.Externals) {
    config.externals = CFG.Externals;
}

registPlugin(config);
registPage(config);

module.exports = config;
