const path = require('path');
const _ = require('lodash');

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
const _DEV_ = process.env.NODE_ENV !== 'production';
const DIRNAME = process.cwd();

let config = {
    dll: {
        lib: ['vue', 'vue-router', 'vuex', 'axios', 'lodash'],
        // lib: ['jquery', 'react', 'react-router', 'react-dom'],
    },
    dllType: 0, //0: no commons or dll , 1 : dll package, 2 : commonsChunk;
    dllName: 'dll.manifest.json',
    commonName: 'common', //
    publicPathDev: '',
    publicPathProd: '',
    dist: 'dist',
    src: 'src',
    banner: '',
    DEV: _DEV_,
};

config.Resource = {
    page: 'views',
    assetName: '[path][name].[ext]?[hash:8]',
    jsDist: 'js',
    jsName: _DEV_ ? '[name].[hash:8].js' : '[name].[chunkhash:8].js',
    cssDist: 'css',
    cssName: _DEV_ ? '[name].[hash:8].css' : '[name].[chunkhash:8].css',
    cssExclude: [/node_modules/, /cssglobal/, /plugin/, /assets/],
    copy: {
        // path: ['assets'],
        // ignore: [{ glob: '**/*', dot: true }]
    }
};

config.Postcss = {
    px2rem: false,
    px2remConfig: {
        rootValue: 100,
        unitPrecision: 5,
        propWhiteList: [],
        propBlackList: [],
        selectorBlackList: [],
        ignoreIdentifier: false,
        replace: true,
        mediaQuery: false,
        minPixelValue: 1
    },
};

config.Entry = {
    index: './src/main.js',
};

config.Externals = {};

config.publicPath = _DEV_ ? config.publicPathDev : config.publicPathProd;
//process.env.NODE_ENV

config.Define = {
    __DEV__: JSON.parse(_DEV_ || 'false'),
    SERVICE_URL: _DEV_ ? 'http://dev.example.com' : 'http://production.example.com'
};

Object.keys(config.Define).forEach(function (key) {
    config.Define[key] = JSON.stringify(config.Define[key]);
});

config.Devtool = _DEV_ ? 'source-map' : false;

config.Provide = {
    /*jQuery: 'jquery',
    $: 'jquery',
    'window.jQuery': 'jquery'*/
}

const Resolve = config.Resolve = {
    extensions: ['.js', '.json', '.jsx', '.vue']
};

Resolve.alias = {
    '~lib': path.resolve(DIRNAME, config.src, 'js/lib'),
    '~cmpt': path.resolve(DIRNAME, config.src, 'component'),
    '~module': path.resolve(DIRNAME, config.src, 'module'),
    '~asset': path.resolve(DIRNAME, config.src, 'assets'),
    'Asset': path.resolve(DIRNAME, config.src, 'assets'),
    '~const': path.resolve(DIRNAME, config.src, 'constant'),
    '~db': path.resolve(DIRNAME, config.src, 'db'),
    '~utils': path.resolve(DIRNAME, config.src, 'utils'),
    '~plugin': path.resolve(DIRNAME, config.src, 'plugin'),
    'vue$': 'vue'
}

config.CssAlias = {
    usage: true,
    alias: {
        '~plugins': Resolve.alias['~plugins'],
        '~asset': Resolve.alias['~asset'],
    }
}

config.ContextReplacement = {
    context: [],
    usage: false,
}
function appendContext(resourceRegExp, newContentResource, newContentRegExp){
    config.ContextReplacement.usage = true;
    config.ContextReplacement.context.push({resourceRegExp, newContentResource, newContentRegExp});
    /*
    *   ContextReplacementPlugin
    *   resourceRegExp  resource matches resourceRegExp
    *   newContentResource  resource from path
    *   newContentRecursive OR newContentRegExp
    *   newContentRecursive  recursive the  newContentResource path
    *   newContentRegExp  all path file matches the newContentRegExp with call by the key name; {key: value};
    */
}

config.Manifest = {
    usage: false,
    rootAssetPath: '',
    include: [],
    body: {},
    assets: undefined,
}
/*
let contentReg = {};
contentReg['home'] = `./module/${projectConfig.home}`;
contentReg['page'] = `./module/${projectConfig.page}`;
for(let i in projectConfig.components){
    contentReg[i] = `./module/${projectConfig.components[i]}`;
}
appendContext(/src([\/\\].+)?$/, path.resolve(DIRNAME, config.src), contentReg);
*/

/**
 * dynamic require modules
 */
/*let contentReg = {};
contentReg['a'] = './module/dynamic/dynamicModule/a';
contentReg['b'] = './module/dynamic/dynamicModule/b';
contentReg['c'] = './module/dynamic/dynamicModule/c';
contentReg['f'] = './module/dynamicOther/f';

appendContext(/module([\/\\].+)?$/, path.resolve(DIRNAME, config.src), contentReg);*/

module.exports = config;
