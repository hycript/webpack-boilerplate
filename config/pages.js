const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const _DEV_ = process.env.NODE_ENV !== 'production';
const CFG = require('./common.js');
const DIRNAME = process.cwd();

const OPTION = {
    favicon: '',
    common: [],
    ext: '.tpl'
};

//inject common module;
if (CFG.dllType === 2) {
    if (_.isPlainObject(CFG.dll) && _.size(CFG.dll)) {
        _.forEach(CFG.dll, function (value, key) {
            OPTION.common.push(key);
        })
    } else {
        OPTION.common.push(CFG.commonName);
    }
}


module.exports = function (config, opt) {
    const pages = Object.keys(getEntry(`${CFG.src}/${CFG.Resource.page}/**/*` + OPTION.ext, `${CFG.src}/${CFG.Resource.page}/`));

    opt = opt || {};
    let _common = opt.common || OPTION.common;

    pages.forEach(function (pathname) {
        let conf = {
            filename: pathname + '.html', //生成的html存放路径，相对于path
            template: '' + path.join(`${CFG.src}/${CFG.Resource.page}/` + pathname + OPTION.ext).replace(/\\/g, '/'),
            // template: ''+path.resolve(DIRNAME,`${CFG.src}/views/` + pathname + OPTION.ext), //html模板路径 //!ejs-render-loader!
            inject: false, //js插入的位置，true/'head'/'body'/false
            /*
            * 压缩这块，调用了html-minify，会导致压缩时候的很多html语法检查问题，
            * 如在html标签属性上使用{{...}}表达式，很多情况下并不需要在此配置压缩项，
            * 另外，UglifyJsPlugin会在压缩代码的时候连同html一起压缩。
            * 为避免压缩html，需要在html-loader上配置'html?-minimize'，见loaders中html-loader的配置。
            */
            minify: { //压缩HTML文件
                removeComments: !CFG ? true : false, //移除HTML中的注释
                collapseWhitespace: !CFG ? true : false //删除空白符与换行符
            },
            hash: false,
        };
        if (pathname in config.entry) {
            conf.favion = path.resolve(DIRNAME, OPTION.favicon);
            conf.inject = 'body';
            conf.chunks = _common.concat(pathname);
            // conf.hash = true;
        }
        config.plugins.push(new HtmlWebpackPlugin(conf));
    });
};

function getEntry(globPath, pathDir) {
    let files = glob.sync(globPath);
    const entries = {};
    let entry, dirname, basename, pathname, extname;

    for (let i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.normalize(path.join(dirname, basename));
        pathDir = path.normalize(pathDir);
        if (pathname.startsWith(pathDir)) {
            pathname = pathname.substring(pathDir.length)
        }
        entries[pathname] = ['./' + entry];
    }
    return entries;
}
