const path = require('path');
const url = require('url');
const webpack = require('webpack');
const _ = require('lodash');

const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');

const DIRNAME = process.cwd();
const CFG = require('./common.js');
const dllConfig = require(path.resolve(DIRNAME, 'config', CFG.dllName));

const registPlugin = function (config) {
    _.isPlainObject(CFG.Define) && !!_.size(CFG.Define) && config.plugins.push(
        new webpack.DefinePlugin(CFG.Define)
    );

    _.isPlainObject(CFG.Provide) && !!_.size(CFG.Provide) && config.plugins.push(
        new webpack.ProvidePlugin(CFG.Provide)
    );

    _.isString(CFG.banner) && config.plugins.push(
        new webpack.BannerPlugin({
            banner: CFG.banner
        })
    );

    if (_.isPlainObject(CFG.Resource.copy) && _.isArray(CFG.Resource.copy.path)) {
        const copy = CFG.Resource.copy;
        const paths = [];
        copy.path.forEach((item) => {
            paths.push({ from: path.resolve(DIRNAME, CFG.src, item), to: item });
        });
        config.plugins.push(
            new CopyWebpackPlugin(paths, {
                ignore: copy.ignore
            })
        )
    }

    if (!!CFG.dllType && CFG.dllType === 2) {
        if (!!_.size(CFG.dll)) {
            _.forEach(CFG.dll, function (value, key) {
                config.plugins.push(
                    new webpack.optimize.CommonsChunkPlugin({
                        name: key,
                        filename: path.join(CFG.Resource.jsDist, CFG.Resource.jsName).replace(/\\/g, '/'),
                    })
                );
            });
        } else {
            config.plugins.push(
                new webpack.optimize.CommonsChunkPlugin({
                    // name: CFG.commonName || 'common',
                    name: CFG.commonName,
                    filename: path.join(CFG.Resource.jsDist, CFG.Resource.jsName.replace('[name]', CFG.commonName)).replace(/\\/g, '/'),
                })
            );
        }
    }


    _.isPlainObject(CFG.dll) && !!_.size(CFG.dll) && CFG.dllType === 1 && (
        config.plugins.push(
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require(path.join(DIRNAME, CFG.dist, CFG.dllName)),
            })
        ),
        config.plugins.push(
            new AddAssetHtmlPlugin(function () {
                let arr = [];
                Object.keys(CFG.dll).forEach(function (value) {
                    Object.keys(dllConfig[value]).forEach(function (type, index) {
                        let asset = dllConfig[value][type];
                        arr.push({
                            filepath: path.join(DIRNAME, CFG.dist, asset),
                            outputPath: CFG.Resource[type + 'Dist'] || '',
                            includeSourcemap: false,
                            publicPath: url.resolve((CFG.publicPath ? CFG.publicPath : ''), (CFG.Resource[type + 'Dist'] || '')),
                            typeOfAsset: type
                        })
                    });
                });
                return arr;
            }())
        )
    );

    /**
     * ContextReplacementPlugin
    */
    if(!!CFG.ContextReplacement && CFG.ContextReplacement.usage === true && CFG.ContextReplacement && _.isArray(CFG.ContextReplacement.context)){
        _.forEach(CFG.ContextReplacement.context, function({resourceRegExp, newContentResource, newContentRegExp}){
            config.plugins.push(
                new webpack.ContextReplacementPlugin(resourceRegExp, newContentResource, newContentRegExp)
            )
        })
    }

    config.plugins.push(
        new ImageminPlugin({
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
        })
    )
};

module.exports = registPlugin;
