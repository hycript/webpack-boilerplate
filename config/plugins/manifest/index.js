const fs = require('fs');
const path = require('path');
const util = require('util');
const merge = require('lodash.merge');
const keys = require('lodash.keys');
const pick = require('lodash.pick');
const find = require('lodash.find');
const get = require('lodash.get');
const assign = require('lodash.assign');
const chalk = require('chalk');
const walk = require('walk');
const EventEmiiter = require('events');
const CopilationAsset = require('./CompilationAsset');
const webpack = require('webpack');

function webpackAssetsManifest(options){
    EventEmiiter.call(this);

    options = options || {};

    const defaults = {
        output: 'manifest.json',
        replacer: null,
        space: 2,
        writeToDisk: false,
        fileExtRegex: /\.w{2,4}\.(?:map|gz)$\.\w+$/i,
        sortManifest: true,
        merge: false,
        publicPath: '',
        rootAssetPath: undefined,
        include: [],
        body: {
            assets: {}
        }
    }

    this.options = pick(
        merge({}, defaults, options),
        keys(defaults)
    );

    if(!Array.isArray(this.options.include)){
        this.options.include = !!this.options.include ? [this.options.include] : [];
    }

    if( options.hasOwnProperty('emit') && !options.hasOwnProperty('writeToDisk') ){
        console.warn( chalk.cyan('Webpack Assets Manifest: options.emit is deprecated - use options.writeToDisk instead') );
        this.options.writeToDisk = ! options.emit;
    }

    // this.assets = options.assets || Object.create(null);
    this.options.body.assets = assign({}, this.options.body.assets, options.assets || {});
    this.options.hasbody = !!options.body;
    this.assets = this.options.body.assets;

    this.compiler = null;
    this.stats = null;
    this.hmrRegex = null;

    if( typeof this.options.publicPath !== 'function' ){
        var prefix = this.options.publicPath + '';

        this.options.publicPath = function addPreFix( str ){
            if( typeof str === 'string' ){
                return prefix + str;
            }

            return str;
        }
    }

    ['apply', 'moduleAsset', 'processAssets', 'done'].forEach( function(key){
        if(options[key]){
            this.on(key, options[key])
        }
    }, this);
}

util.inherits(webpackAssetsManifest, EventEmiiter);

webpackAssetsManifest.prototype.getExtension = function(filename){
    if(!filename){
        return '';
    }

    filename = filename.split(/[?#]/)[0];

    if(this.options.fileExtRegex){
        let ext = filename.match(this.options.fileExtRegex);

        return ext && ext.length ? ext[0] : '';
    }

    return path.extname(filename);
}

webpackAssetsManifest.prototype.getStatsData = function(stats){
    if(typeof stats !== 'object'){
        throw new TypeError('stats must be an object');
    }

    this.stats = stats.toJson('verbose');

    return this.stats;
}

webpackAssetsManifest.prototype.fixKey = function(key){
    return key.replace(/\\/g, '/');
}

webpackAssetsManifest.prototype.isHMR = function(filename){
    return this.hmrRegex ? this.hmrRegex.test(filename) : false;
}

webpackAssetsManifest.prototype.set = function(key, value){
    this.assets[this.fixKey(key)] = this.options.publicPath(value, this);

    return this;
}

webpackAssetsManifest.prototype.has = function(key){
    return Object.prototype.hasOwnProperty.call(this.assets, this.fixKey(key));
}

webpackAssetsManifest.prototype.get = function(key, defaultValue){
    return this.has(key) ? this.assets[this.fixKey(key)] : defaultValue || '';
}

webpackAssetsManifest.prototype.delete = function(key){
    delete this.assets[this.fixKey(key)];
}

webpackAssetsManifest.prototype.processAssets = function(assets){
    const keys = Object.keys(assets);
    let index = keys.length;

    while(index --){
        let name = keys[index];
        let filenames = assets[name];

        if(!Array.isArray(filenames)){
            filenames = [filenames];
        }

        for(let i = 0, l = filenames.length; i < l; ++i){
            let filename = name + this.getExtension(filenames[i]);

            if(this.isHMR(filenames[i])){
                continue;
            }

            this.set(filename, filenames[i]);
        }
    }

    this.emit('processAssets', this, assets);

    return this.assets;
}

webpackAssetsManifest.prototype.toJSON = function(){
    if(this.options.sortManifest){
        var keys = Object.keys(this.assets);

        if(typeof this.options.sortManifest === 'function'){
            keys.sort(this.options.sortManifest.bind(this));
        }else{
            keys.sort();
        }
        let assets = keys.reduce(function(sorted, key){
            sorted[key] = this.assets[key];
            return sorted;
        }.bind(this), Object.create(null));

        return this.options.hasbody ? assign({}, this.options.body, {assets: assets}) : assets;
    }
    // return this.assets;
    return this.options.hasbody ? this.options.body : this.assets;
}

webpackAssetsManifest.prototype.toString = function(){
    return JSON.stringify(this, this.options.replacer, this.options.space) || '{}';
}

webpackAssetsManifest.prototype.maybeMerge = function(){
    if(this.options.merge){
        try{
            let data = JSON.parse(fs.readFileSync(this.getOutputPath()));

            for(let key in data){
                if(!this.has(key)){
                    this.set(key, data[key]);
                }
            }
        }catch(err){

        }
    }
}

webpackAssetsManifest.prototype.handleEmit = function(compilation, callback){
    this.processAssets(this.getStatsData(compilation.getStats()).assetsByChunkName);

    this.maybeMerge();

    var output = this.inDevServer()
        ? path.basename(this.getOutputPath())
        : path.relative(this.compiler.outputPath, this.getOutputPath());

    compilation.assets[output] = new CopilationAsset(this);

    callback();
}

webpackAssetsManifest.prototype.handleAfterEmit = function(compilation, callback){
    if(!this.options.writeToDisk){
        callback();
        return;
    }
    let output = this.getOutputPath();

    require('mkdirp')(path.dirname(output), function(){
        fs.writeFile(
            output,
            this.toString(),
            function(){
                callback();
            }
        )
    }.bind(this));
}

webpackAssetsManifest.prototype.handleModuleAsset = function(module, hashedFile){
    let key = path.join(path.dirname(hashedFile), path.basename(module.userRequest));

    if(this.isHMR(hashedFile)){
        return;
    }

    this.set(key, hashedFile);

    this.emit('moduleAsset', this, key, hashedFile, module);
}

webpackAssetsManifest.prototype.handleCompilation = function(compilation){
    compilation.plugin('module-asset', this.handleModuleAsset.bind(this));
}

webpackAssetsManifest.prototype.inDevServer = function(){
    if(find(process.argv, function(arg){ return arg.lastIndexOf('webpack-dev-server') > -1 })){
        return true;
    }

    return !!this.compiler && this.compiler.outputFileSystem.constructor.name === 'MemoryFileSystem';
}

webpackAssetsManifest.prototype.getOutputPath = function(){
    if(!this.compiler){
        return '';
    }

    if(path.isAbsolute(this.options.output)){
        return this.options.output;
    }

    if(this.inDevServer()){
        let outputPath = get(this, 'compiler.options.devServer.outputPath', get(this, 'compiler.outputPath', '/'));

        if(outputPath === '/'){
            console.warn(chalk.cyan('Webpack Assets Manifest: Please use an absolute path in options.output when using webpack-dev-server.'));
            outputPath = get(this, 'compiler.context', process.cwd());
        }
        return path.resolve(outputPath, this.options.outputPath)
    }

    return path.resolve(this.compiler.outputPath, this.options.output);
}

webpackAssetsManifest.prototype.walkAndPrefetchAssets = function(compiler){
    const self = this;

    const options = {
        listeners: {
            file: function(root, fileStat, next){
                const assetPath = self.fixKey('./' + path.join(root, fileStat.name));
                if(self.isSafeToTrack(assetPath)){
                    compiler.apply(new webpack.PrefetchPlugin(assetPath));
                }
                next();
            }
        }
    }
    walk.walkSync(this.options.rootAssetPath, options);
}

webpackAssetsManifest.prototype.isSafeToTrack= function(path){
    let result = false;

    for(var i = 0, l = this.options.include.length; i < l; i++){
        let includePath = this.options.include[i];
        switch(true){
        case typeof includePath === 'function' && includePath(path):
            result = true;
            break;
        case typeof includePath === 'string' && path.indexOf(includePath) > -1:
            result = true
            break;
        case includePath instanceof RegExp && !!includePath.test(path):
            result = true;
            break;
        }
    }

    return result;
}

webpackAssetsManifest.prototype.apply = function(compiler){
    let output = compiler.options.output;

    this.compiler = compiler;

    if(output.filename !== output.hotUpdateChunkFilename){
        this.hmrRegex = new RegExp(
            output.hotUpdateChunkFilename
                .replace(/\./g, '\\.')
                .replace(/\[a-z]+(:\d+)?\]/gi, function(m, n){
                    return '.' + (n ? '{' + n.substr(1) + '}' : '+');
                }) + '$',
            'i'
        )
    }

    if(this.options.rootAssetPath){
        this.walkAndPrefetchAssets(compiler);
    }

    compiler.plugin('compilation', this.handleCompilation.bind(this));
    compiler.plugin('emit', this.handleEmit.bind(this));
    compiler.plugin('after-emit', this.handleAfterEmit.bind(this));
    compiler.plugin('done', this.emit.bind(this, 'done', this));

    this.emit('apply', this);
}

module.exports = webpackAssetsManifest;
