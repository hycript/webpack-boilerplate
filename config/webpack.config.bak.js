const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');

// const ManifestPlugin = require('webpack-manifest-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');

const postcss = require('postcss');
const postcssSmartImport = require('postcss-smart-import');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const easysprite = require('postcss-easysprites');
// const sprites = require('postcss-sprites');
// const updateRule = require('postcss-sprites/lib/core').updateRule;

const DIRNAME = process.cwd();
const pageConfig = require('./pages.js');
// const dllConfig = require('./dll.manifest.json');
const CFG = require('./common.js');
const sourceRoot = './src/';
const excludeCss = [/node_modules/, /cssglobal/];

const publicPath = '';
// const publicPath = 'http://10.0.1.168/menupadh5/webpack/dist/';

let config = {
    entry: {
        app: './src/js/app.js',
        vendor: './src/js/vendor.js',
        main: './src/js/main.jsx',
        // common: ['jquery', 'react', 'react-dom','react-router'],
        // public : ['./src/css/style.css','./src/css/sass.css'], public可合并到common中打包.
    },
    output: {
        path: path.resolve(DIRNAME, 'dist'),
        filename: 'js/[name].[chunkhash:8].js',
        // publicPath: 'dist/',
        publicPath: publicPath
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                /*options: {
                    presets: ['es2015', 'react']
                }*/
            }]
        },
        {
            test: /\.less$/,
            use: [{
                loader: 'style-loader' // creates style nodes from JS strings
            }, {
                loader: 'css-loader', // translates CSS into CommonJS
                options: {
                    modules: true,
                    /*localIdentName: '[hash:base64:12]_[name]_[local]',
                    sourceMap : true,
                    camelCase: true*/
                }
            }, {
                loader: 'less-loader' // compiles Less to CSS
            }]
        },
        {
            test: /\.scss$/,
            /*use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                    }
                },
                'sass-loader'
            ] */
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false,
                            localIdentName: '[hash:base64:8]_[name]_[local]',
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                postcssSmartImport(),
                                precss(),
                                autoprefixer(),
                            ]
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [path.resolve(DIRNAME, './node_modules/compass-mixins/lib')],
                            http_path: '/',
                            css_dir: 'src/css',
                            sass_dir: 'src/sass',
                            imagePath: 'src/images',
                            javascripts_dir: 'src/js'
                        }
                    }
                ],
                publicPath: publicPath ? publicPath : '../'
            })
        },
        {
            test: /\.css$/,
            exclude: excludeCss,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[hash:base64:8]_[name]_[local]',
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                postcssSmartImport(),
                                precss(),
                                autoprefixer(),
                                easysprite({
                                    imagePath: 'src/images',
                                    spritePath: 'src/sprites/',
                                })
                            ],
                            outputStyle: 'expanded'
                        }
                    },
                ],
                publicPath: publicPath ? publicPath : '../'
            })
        },
        {
            test: /\.css$/,
            include: excludeCss,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false,
                            /*localIdentName: '[hash:base64:8]_[name]_[local]',
                            sourceMap: true,*/
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                postcssSmartImport(),
                                precss(),
                                autoprefixer(),
                                easysprite({
                                    imagePath: 'src/images',
                                    spritePath: 'src/sprites/',
                                })
                                /*sprites({
                                    verbose: true,
                                    stylesheetPath: 'src/css/',
                                    spritePath: 'src/sprites/',
                                    basePath: '',
                                    relativeTo: 'rule' ,
                                    retina: true,
                                    filterBy: function (image) {
                                        if (image.originalUrl.indexOf('?__sprite') === -1) {
                                            return Promise.reject();
                                        }
                                        console.log('image :: ', image);
                                        return Promise.resolve();
                                    },
                                    groupBy: function (image) {
                                        // image.originalUrl
                                        var _style = image.styleFilePath.split('\\');
                                        _style = _style[_style.length-1].split('.')[0];
                                        var _match = image.originalUrl.match(/\?__sprite=(.+)/);
                                        if(!!_match && _match[1]){
                                            return Promise.resolve(_style + '-' + _match[1]);
                                        }
                                        _match = image.originalUrl.match(/\/([^\/]+)/g);
                                        if(!!_match){
                                            return Promise.resolve(_style + '-' + (_match[_match.length-2] && _match[_match.length-2].substr(1) || ''));
                                        }
                                        return Promise.reject(new Error('Not a shape image:'+image.originalUrl));
                                    },
                                    hooks: {
                                        onUpdateRule: function(rule, token, image) {
                                            // updateRule(rule, token, image);

                                            var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
                                            var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
                                            var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
                                            var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

                                            backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
                                            backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
                                            backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
                                            backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

                                            var backgroundImage = postcss.decl({
                                                prop: 'background-image',
                                                value: 'url(' + image.spriteUrl + ')'
                                            });

                                            var backgroundSize = postcss.decl({
                                                prop: 'background-size',
                                                value: backgroundSizeX + '% ' + backgroundSizeY + '%'
                                            });

                                            var backgroundPosition = postcss.decl({
                                                prop: 'background-position',
                                                value: backgroundPositionX + '% ' + backgroundPositionY + '%'
                                            });

                                            rule.insertAfter(token, backgroundImage);
                                            rule.insertAfter(backgroundImage, backgroundPosition);
                                            rule.insertAfter(backgroundPosition, backgroundSize);

                                            ['width', 'height'].forEach(function(prop) {
                                                var value = image.coords[prop];
                                                if (image.retina) {
                                                    value /= image.ratio;
                                                }
                                                rule.insertAfter(rule.last, postcss.decl({
                                                    prop: prop,
                                                    value: value + 'px'
                                                }));
                                            });
                                        },
                                        onSaveSpritesheet: function(opts, spritesheet){
                                            var filenameChunks = spritesheet.groups.concat(spritesheet.extension);
                                            return path.join(opts.spritePath, filenameChunks.join('.'));
                                        }
                                    },
                                })*/
                            ],
                            outputStyle: 'expanded'
                        }
                    },
                ],
                publicPath: publicPath ? publicPath : '../'
            })
        },
        {
            test: /\.(mp4|mp3)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    // outputPath : './images/',
                    // publicPath : './dist/images/',
                    context: path.resolve(DIRNAME, sourceRoot),
                    name: '[path][name].[ext]?[hash:8]'
                    // emit: true,
                }
            }]
        },
        {
            test: /\.(png|jpe?g|svg|gif|woff|eot|ttf)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    // outputPath : './images/',
                    // publicPath : './dist/images/',
                    limit: 1024,
                    context: path.resolve(DIRNAME, sourceRoot),
                    name: '[path][name].[ext]?[hash:8]',
                    // name : 'images/[name].[hash:8].[ext]?',
                    // emit: true,
                }
            }]
        },
        {
            test: /\.html$/,
            use: [
                {
                    loader: 'html-loader',
                    options: {
                        minimize: true
                    }
                }
            ]
        }
            /*{
                test: /\.(html)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'html/[name].[ext]',
                        }
                    },
                    'extract-loader',
                    {
                        loader: 'html-loader',
                        options: {
                            // minimize: true
                            ignoreCustomFragments: [/\{\{.*?}}/],
                            root: path.resolve(DIRNAME, 'dist'),
                            attrs: ['img:src', 'link:href']
                        }
                    }
                ]
            }*/
        ]
    },
    resolve: {
        alias: {
            Lib: path.resolve(DIRNAME, 'src/js/lib')
        }
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
    // devtool: process.env.NODE_ENV !== 'production' ? 'inline-source-map' : false,
    plugins: [
        /*new AddAssetHtmlPlugin([{
            filepath: path.join(DIRNAME,'dist',dllConfig.__LIB__.js),
            outputPath: 'js',
            includeSourcemap: false,
            publicPath: publicPath ? publicPath+'/js' : 'js',
        }]),*/
        /*new webpack.DllReferencePlugin({
            context: '.',
            manifest: require("./dist/dll.manifest.json"),
        }),*/
        new CopyWebpackPlugin([
            { from: path.resolve(DIRNAME, 'src/images'), to: 'images' },
        ]),
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
        /*new webpack.optimize.UglifyJsPlugin({
            compress : {
                warnings : false,
                drop_console : false,
            }
        }),*/
        new webpack.BannerPlugin({
            banner: '@losm'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            filename: 'js/common.[hash:8].js'
            // names: ['app','main','vendor'],
            // children : true,
            // filename: 'js/common.[hash:8].js'
        }),
        new webpack.DefinePlugin({
            __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false')),
            SERVICE_URL: JSON.stringify('http://dev.example.com')
        }),
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            'window.jQuery': 'jquery'
        }),
        new ExtractTextPlugin({
            // filename : 'css/style.css',
            // filename : 'css/style.[chunkhash:8].css'
            filename: 'css/[name].[chunkhash:8].css',
            allChunks: true
        }),
        // new ManifestPlugin(),
        new WebpackAssetsManifest({
            output: 'manifest.json',
            replacer: null,
            space: 2,
            writeToDisk: false,
            fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
            sortManifest: true,
            merge: false,
            publicPath: publicPath
        }),
        // new webpack.HotModuleReplacementPlugin()
        /*new HtmlWebpackPlugin({
            title : 'HtmlWebpackPlugin',
            filename : 'index.html',
            inject : 'head',
            template : 'src/html/index.html',
            chunks : ['common','app'],
            minify : {
                removeComments:true,    //移除HTML中的注释
                collapseWhitespace:false    //删除空白符与换行符
            }
        }),*/
    ]
};

/*
!!CFG.dll && config.plugins.push(
    new AddAssetHtmlPlugin(function(){
        let arr = [];
        Object.keys(CFG.dll).forEach(function(value){
            Object.keys(dllConfig[value]).forEach(function(type,index){
                let asset = dllConfig[value][type];
                arr.push({
                    filepath: path.join(DIRNAME,'dist',asset),
                    outputPath: type,
                    includeSourcemap: false,
                    publicPath: publicPath ? publicPath+'/'+type : type,
                    typeOfAsset: type
                })
            });
        });
        return arr;
    }())
);*/

pageConfig(config, {
    publicPath: publicPath,
});

module.exports = config;
