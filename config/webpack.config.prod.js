const webpack = require('webpack');
const path = require('path');
const _ = require('lodash');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const ImageminPlugin = require('imagemin-webpack-plugin').default;
// const imageminMozjpeg = require('imagemin-mozjpeg');

// const WebpackAssetsManifest = require('webpack-assets-manifest');
const WebpackAssetsManifest = require('./plugins/manifest');

/*addition*/
/*const StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');*/
// const ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');


const DIRNAME = process.cwd();
const CFG = require('./common.js');
const registPage = require('./pages.js');
const registPlugin = require('./plugins.js');
const registRule = require('./rules.js');

const sourceMap = false;
const src = CFG.src;
const exclude = CFG.Resource.cssExclude;
const include = CFG.Resource.cssExclude;
const minimize = true;
const extract = true;

let config = {
    entry: {},
    output: {
        path: path.resolve(DIRNAME, CFG.dist),
        filename: path.join(CFG.Resource.jsDist, CFG.Resource.jsName).replace(/\\/g, '/'),
        publicPath: CFG.publicPath
    },
    module: {
        rules: [
            // registRule.eslint({ emitError: true }),
            registRule.js(),
            /*module style*/
            registRule.vue({ sourceMap, extract, modules: true, src, minimize }), //langs: ['less','sass','css'],
            registRule.less({ sourceMap, extract, modules: true, src, exclude, minimize }),
            registRule.sass({ sourceMap, extract, modules: true, src, exclude, minimize }),
            registRule.css({ sourceMap, extract, modules: true, src, exclude, minimize }),
            /*global style*/
            registRule.less({ sourceMap, extract, modules: false, src, include, minimize }),
            registRule.sass({ sourceMap, extract, modules: false, src, include, minimize }),
            registRule.css({ sourceMap, extract, modules: false, src, include, minimize }),
            /*file*/
            registRule.asset({ limit: 2048 }),
            registRule.file(),
            registRule.html({ minimize }),
            /*glslifyLoader*/
            // registRule.glsl(),
        ]
    },
    resolve: {
        alias: CFG.Alias,
        extensions: CFG.Resolve.extensions
    },
    externals: {
        //as a module to use;
        // _data_ : 'data' ,
    },
    devServer: {
        // inline: true,
        // hot: true,
        // contentBase: path.join(DIRNAME, "dist"),
        // compress: true,
    },
    devtool: CFG.Devtool,
    plugins: [
        new ExtractTextPlugin({
            filename: path.join(CFG.Resource.cssDist, CFG.Resource.cssName).replace(/\\/g, '/'),
            allChunks: true
        }),
        /*new ImageminPlugin({
            // disable: process.env.NODE_ENV !== 'production',
            test: /\.(jpe?g|png|gif|svg)$/i,
            plugins: [
                imageminMozjpeg({
                    quality: 75,
                    // progressive: true
                })
            ],
            pngquant: {
                // quality: '80-100'
            }
        }),*/
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: true,
            }
        }),
        // new webpack.optimize.ModuleConcatenationPlugin()
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

if(CFG.Manifest && CFG.Manifest.usage){
    config.plugins.push(
        new WebpackAssetsManifest({
            output: 'manifest.json',
            rootAssetPath: CFG.Manifest.rootAssetPath || '',
            include: CFG.Manifest.include || [],
            body: CFG.Manifest.body,
            assets: CFG.Manifest.assets,
            replacer: null,
            space: 2,
            writeToDisk: false,
            fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
            sortManifest: true,
            merge: false,
            publicPath: CFG.publicPath,
        })
    )
}

registPlugin(config);
registPage(config);

module.exports = config;
