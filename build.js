var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var uglify = require('uglify-js');
var rollup = require('rollup');
var commonjs = require('rollup-plugin-commonjs');
var npm = require('rollup-plugin-npm');
var replace = require('rollup-plugin-replace');

Promise
  .all([
    generateCommonModule(),
    generateBundledDev(),
    generateBundledProd(),
  ]);

function generateCommonModule() {
  return rollup
    .rollup({
      entry: 'index.js',
      external: [ 'redux', 'object-path-immutable' ],
    })
    .then(function(bundle) {
      return bundle.generate({
        format: 'cjs',
      }).code;
    })
    .then(function(code) {
      write('dist/redux-cache.common.js', code);
    });
}

function generateBundledDev() {
  return rollup
    .rollup({
      entry: 'index.js',
      external: [ 'redux' ],
      plugins: [
        replace({
          'process.env.NODE_ENV': '\'development\'',
        }),
        npm({
          main: true,
        }),
        commonjs({
          include: 'node_modules/**',
        }),
      ],
    })
    .then(function(bundle) {
      return bundle.generate({
        format: 'iife',
        moduleName: 'ReduxCache',
        globals: { redux: 'Redux' },
      }).code;
    })
    .then(function(code) {
      write('dist/redux-cache.js', code);
    });
}

function generateBundledProd() {
  return rollup
    .rollup({
      entry: 'index.js',
      external: [ 'redux' ],
      plugins: [
        replace({
          'process.env.NODE_ENV': '\'production\'',
        }),
        npm({
          main: true,
        }),
        commonjs({
          include: 'node_modules/**',
        }),
      ],
    })
    .then(function(bundle) {
      return bundle.generate({
        format: 'iife',
        moduleName: 'ReduxCache',
        globals: { redux: 'Redux' },
      }).code;
    })
    .then(function(code) {
      return uglify.minify(code, {
        fromString: true,
      }).code;
    })
    .then(function(code) {
      return write('dist/redux-cache.min.js', code);
    }); 
}

function write(dest, code) {
  return new Promise(function(resolve, reject) {
    mkdirp(path.dirname(dest), function(err) {
      if (err) return reject(err);
      fs.writeFile(dest, code, function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}
