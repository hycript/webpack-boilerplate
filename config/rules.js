const path = require('path');
const _ = require('lodash');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const postcss = require('postcss');
const postcssSmartImport = require('postcss-smart-import');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const easysprite = require('postcss-easysprites');
const pxtorem = require('postcss-plugin-px2rem');

const _DEV_ = process.env.NODE_ENV !== 'production';
const CFG = require('./common.js');
const DIRNAME = process.cwd();

const TYPE = {
    VUELOADER: 'vue-style-loader'
};

const _loaders = {
    style: function () {
        return {
            loader: 'style-loader'
        }
    },
    css: function ({ modules = true, sourceMap = true, minimize = false, name }) {
        const _rule = {
            loader: 'css-loader',
            options: {
                modules,
                sourceMap,
                minimize,
            }
        };
        if(CFG.CssAlias && CFG.CssAlias.usage && _.isPlainObject(CFG.CssAlias.alias)){
            _rule.options.alias = CFG.CssAlias.alias;
        }
        if (modules) {
            _rule.options.localIdentName = name || '[hash:base64:8]_[name]_[local]';
        }
        return _rule;
    },
    postcss: function ({ sprites = false, src = CFG.src }) {
        const plugins = [
            postcssSmartImport(),
            precss(),
            autoprefixer(),
        ];
        if(CFG.Postcss){
            const {px2rem, px2remConfig} = CFG.Postcss;
            if(!!px2rem){
                plugins.push(pxtorem(px2remConfig))
            }
        }
        if (sprites) {
            plugins.push(
                easysprite({
                    imagePath: path.join(src, 'images'),
                    spritePath: path.join(src, 'sprites'),
                })
            )
        }
        const _rule = {
            loader: 'postcss-loader',
            options: {
                plugins
            }
        };
        return _rule;
    },
    extract: function ({ publicPath = CFG.publicPath, fallback = 'style-loader' } = {}) {
        return ExtractTextPlugin.extract({
            fallback: fallback,
            use: [],
            publicPath: publicPath ? publicPath : '../'
        })
    },
    precss: {
        sass: function ({ src = CFG.src } = {}) {
            return {
                loader: 'sass-loader',
                options: {
                    includePaths: [path.resolve(DIRNAME, './node_modules/compass-mixins/lib')],
                    /*http_path: '/',
                    css_dir: path.join(src, 'css'),
                    sass_dir: path.join(src, 'sass'),
                    imagePath: path.join(src, 'images'),
                    javascripts_dir: path.join(src, 'js'),*/
                    // sourceMap
                }
            };
        },
        less: function ({ src = CFG.src } = {}) {
            return {
                loader: 'less-loader',
                options: {
                    // sourceMap
                }
            }
        },
        stylus: function ({ src = CFG.src } = {}) {
            return {
                loader: 'stylus-loader',
                options: {
                    // sourceMap
                }
            }
        },
    }
};


const eslintLoader = function ({ test, include, exclude = /node_modules/, emitError = false, emitWarning = false } = {}) {
    return {
        enforce: 'pre',
        test: test || /\.(js|jsx|vue)$/,
        include,
        exclude,
        loader: 'eslint-loader',
        options: {
            emitError,
            emitWarning,
            formatter: require('eslint-friendly-formatter'),
            configFile: './.eslintrc.js'
        }
    }
}

const jsLoader = function ({test, exclude = /node_modules/} = {}) {
    return {
        test: test || /\.(js|jsx)$/,
        exclude,
        use: [{
            loader: 'babel-loader',
        }]
    }
}

const cssLoader = function ({ test, extract = false, modules = false, publicPath = CFG.publicPath, src = CFG.src, sourceMap = true, minimize, exclude, include, name, sprites, type = 'css', fallback } = {}) {
    const loader = {
        test: test || /\.css$/,
        exclude,
        include,
        use: []
    };
    let _use = loader.use;
    if (extract) {
        _use = loader.use = _loaders.extract({ publicPath, fallback });
    } else {
        _use.push(_loaders.style())
    }
    _use.push(_loaders.css({ modules, sourceMap, name, minimize }));

    if (fallback !== TYPE.VUELOADER) {
        _use.push(_loaders.postcss({ sprites, src }));
    }

    !!type && type !== 'css' && _loaders.precss[type] && _use.push(_loaders.precss[type](src, sourceMap));

    return loader;
}

const sassLoader = function (option = {}) {
    let args = [].slice.call(arguments)[0];
    args.type = 'sass';
    args.test = option.test || /\.scss$/;
    return cssLoader(args);
}

const lessLoader = function (option = {}) {
    let args = [].slice.call(arguments)[0];
    args.type = 'less';
    args.test = option.test || /\.less$/;
    return cssLoader(args);
}

const stylusLoader = function (option = {}) {
    let args = [].slice.call(arguments)[0];
    args.type = 'stylus';
    args.test = option.test || /\.styl$/;
    return cssLoader(args);
}

const htmlLoader = function ({ test, minimize = false, include, exclude } = {}) {
    return {
        test: test || /\.html$/,
        include,
        exclude,
        use: [
            {
                loader: 'html-loader',
                options: {
                    minimize: minimize || false
                }
            }
        ]
    }
}

const assetLoader = function ({ test, limit = 8 * 1024, name, src = CFG.src, include, exclude, prefix } = {}) {
    return {
        test: test || /\.(png|jpe?g|gif|eot|woff|woff2|svg|ttf)$/,
        exclude,
        include,
        use: [{
            loader: 'url-loader',
            options: {
                prefix,
                limit: limit || 8 * 1024,
                context: path.resolve(DIRNAME, CFG.src),
                name: name || (CFG.Resource && CFG.Resource.assetName) || '[path][name].[ext]?[hash:8]',
                // emit: true,
            }
        }]
    };
}

const fileLoader = function ({ test, name, src = CFG.src, include, exclude, prefix, limit } = {}) {
    return {
        test: test || /\.(mp4|mp3)$/,
        include,
        exclude,
        use: [{
            loader: 'file-loader',
            options: {
                context: path.resolve(DIRNAME, CFG.src),
                limit,
                prefix,
                name: name || (CFG.Resource && CFG.Resource.assetName) || '[path][name].[ext]?[hash:8]'
                // emit: true,
            }
        }]
    }
}

const vueLoader = function ({ extract = false, modules = false, modulesName, publicPath = CFG.publicPath, src = CFG.src, sourceMap = true, minimize, sprites, langs = ['css', 'scss', 'less'] } = {}) {
    const _rule = {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
            loaders: {
            },
            cssSourceMap: false
        }
    };

    if (!!modules) {
        _rule.options.cssModules = {
            camelCase: true,
            localIdentName: modulesName || '[hash:base64:8]_[name]_[local]'
        }
    }

    const options = {
        extract, publicPath, src, minimize, sourceMap, sprites, fallback: TYPE.VUELOADER
    };

    !!_.isArray(langs) && langs.forEach((lang) => {
        let _lang = lang === 'scss' ? 'sass' : lang;
        let _options = Object.assign({}, options, { type: _lang });
        let _cssRule = cssLoader(_options);
        _rule.options.loaders[lang] = _cssRule.use;
    });

    _rule.options.postcss = _loaders.postcss({ sprites }).options.plugins;

    return _rule;
}

const glslifyLoader = function({ test, include, exclude = /node_modules/ } = {}){
    const loader = {
        test: test || /\.(glsl|frag|vert)$/,
        exclude,
        include,
        use: []
    };
    loader.use.push({
        loader: 'glslify-loader'
    });
    loader.use.push({
        loader: 'raw-loader'
    });
    return loader;
}

module.exports = {
    eslint: eslintLoader,
    js: jsLoader,
    css: cssLoader,
    less: lessLoader,
    sass: sassLoader,
    stylus: stylusLoader,
    asset: assetLoader,
    file: fileLoader,
    vue: vueLoader,
    html: htmlLoader,
    glsl: glslifyLoader,
}
