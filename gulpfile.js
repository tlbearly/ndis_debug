// Minify css and js into one file.
// Goto npmjs.com, click 'Install npm', then click 'download Node.js and npm'.
// Goto https://nodejs.org/en/ and download latest version of node.js click on downloaded file.
// ***Keep up to date: npm install npm@latest -g
// npm install gulp@4.0.2     <-- change version number here
// npm install --save-dev gulp-css
// npm install --save-dev gulp-uglify
// npm install --save-dev gulp-concat
// npm install pump
//
// To minify run: gulp filenameD (desktop) or filenameM (mobile) from the debug directory.
// For example: gulp searchD
// Will minify wwwroot/javascript/search.js and wwwroot/javascriptM/search.js
// Example 2 merge all js files into one: gulp js
// Will minify all debug/src/javascript files into ../javascript/libs_ver#.##.js
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var cssMin = require('gulp-css');
var pump = require('pump');
var ver = "3.17";

// MINIFY CSS
gulp.task('layout', function(err) {
    pump([
        gulp.src('./assets/css/layout.css'),
        cssMin(),
        gulp.dest('../assets/css')
    ], err);
});
gulp.task('layoutM', function(err) {
    pump([
        gulp.src('./assets/css/layoutM.css'),
        cssMin(),
        gulp.dest('../assets/css')
    ], err);
});
gulp.task('help', function(err) {
    pump([
        gulp.src('./assets/css/help.css'),
        cssMin(),
        gulp.dest('../assets/css')
    ], err);
});
gulp.task('fishhelp', function(err) {
    pump([
        gulp.src('./assets/css/fishhelp.css'),
        cssMin(),
        gulp.dest('../assets/css')
    ], err);
});

gulp.task('js', function(err) {
    // desktop
    pump([
        gulp.src([
            './javascript/src/bookmark.js',
            './javascript/src/disclaimer.js',
            './javascript/src/draw.js',
            './javascript/src/errorBox.js',
            './javascript/src/findPlace.js',
            './javascript/src/gmu.js',
            './javascript/src/identify.js',
            './javascript/src/mapLinks.js',
            './javascript/src/print.js',
            './javascript/src/readConfig.js',
            './javascript/src/resourceReport.js',
            './javascript/src/search.js',
            './javascript/src/utilFuncs.js',
            './javascript/src/xmlUtils.js'
        ])
        .pipe(concat('libs_' + ver + '.js')),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop bookmark
gulp.task('bookmarkD', function(err) {
    pump([
        gulp.src('./javascript/src/bookmark.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop disclaimer
gulp.task('disclaimerD', function(err) {
    pump([
        gulp.src('./javascript/src/disclaimer.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop draw
gulp.task('drawD', function(err) {
    pump([
        gulp.src('./javascript/src/draw.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop errorBox
gulp.task('errorBoxD', function(err) {
    pump([
        gulp.src('./javascript/src/errorBox.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop findPlace
gulp.task('findPlaceD', function(err) {
    pump([
        gulp.src('./javascript/src/findPlace.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop gmu
gulp.task('gmuD', function(err) {
    pump([
        gulp.src('./javascript/src/gmu.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop identify
gulp.task('identifyD', function(err) {
    pump([
        gulp.src('./javascript/src/identify.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// HB1298
gulp.task('hb1298D', function(err) {
    // desktop only!
    pump([
        gulp.src('./javascript/src/hb1298.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop mapLink
gulp.task('mapLinkD', function(err) {
    pump([
        gulp.src('./javascript/src/mapLink.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop print
gulp.task('printD', function(err) {
    pump([
        gulp.src('./javascript/src/print.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop readConfig
gulp.task('readConfigD', function(err) {
    pump([
        gulp.src('./javascript/src/readConfig.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop resourceReport
gulp.task('resourceReportD', function(err) {
    pump([
        gulp.src('./javascript/src/resourceReport.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop search
gulp.task('searchD', function(err) {
    pump([
        gulp.src('./javascript/src/search.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop utilFuncs
gulp.task('utilFuncsD', function(err) {
    pump([
        gulp.src('./javascript/src/utilFuncs.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop xmlUtils
gulp.task('xmlUtilsD', function(err) {
    pump([
        gulp.src('./javascript/src/xmlUtils.js'),
        uglify(),
        gulp.dest('../javascript')
    ], err);
});

// desktop TOC
gulp.task('tocD', function(err) {
    // desktop
    pump([
        gulp.src('./javascript/toc/src/agsjs/dijit/TOC.js'),
        uglify(),
        gulp.dest('../javascript/toc/build/agsjs/dijit')
    ], err);
});

// MOBILE MINIFY JS
gulp.task('jsM', function(err) {
    pump([
        gulp.src([
            './javascriptM/src/Bookmark.js',
            './javascriptM/src/disclaimer.js',
            './javascriptM/src/errorBox.js',
            './javascriptM/src/findPlace.js',
            './javascriptM/src/geo.js',
            './javascriptM/src/graphicFuncs.js',
            './javascriptM/src/identify.js',
            './javascriptM/src/print.js',
            './javascriptM/src/readConfig.js',
            './javascriptM/src/search.js',
            './javascriptM/src/swipe.js',
            './javascriptM/src/utilFuncs.js',
            './javascriptM/src/wayPoints.js',
            './javascriptM/src/xmlUtils.js'
        ])
        .pipe(concat('libs_' + ver + '.js')),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('BookmarkM', function(err) {
    pump([
        gulp.src('./javascriptM/src/Bookmark.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('disclaimerM', function(err) {
    pump([
        gulp.src('./javascriptM/src/disclaimer.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('errorBoxM', function(err) {
    pump([
        gulp.src('./javascriptM/src/errorBox.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('findPlaceM', function(err) {
    pump([
        gulp.src('./javascriptM/src/findPlace.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('geoM', function(err) {
    pump([
        gulp.src('./javascriptM/src/geo.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('graphicFuncsM', function(err) {
    pump([
        gulp.src('./javascriptM/src/graphicFuncs.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('hb1298M', function(err) {
    pump([
        gulp.src('./javascriptM/src/hb1298.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('HelpWinM', function(err) {
    pump([
        gulp.src('./javascriptM/src/HelpWin.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('identifyM', function(err) {
    pump([
        gulp.src('./javascriptM/src/identify.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('printM', function(err) {
    pump([
        gulp.src('./javascriptM/src/print.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('readConfigM', function(err) {
    pump([
        gulp.src('./javascriptM/src/readConfig.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('searchM', function(err) {
    pump([
        gulp.src('./javascriptM/src/search.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('swipeM', function(err) {
    pump([
        gulp.src('./javascriptM/src/swipe.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('utilFuncsM', function(err) {
    pump([
        gulp.src('./javascriptM/src/utilFuncs.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('wayPointsM', function(err) {
    pump([
        gulp.src('./javascriptM/src/wayPoints.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

gulp.task('xmlUtilsM', function(err) {
    pump([
        gulp.src('./javascriptM/src/xmlUtils.js'),
        uglify(),
        gulp.dest('../javascriptM')
    ], err);
});

// TOC mobile
gulp.task('tocM', function(err) {
    pump([
        gulp.src('./javascriptM/toc/src/agsjs/dijit/TOC.js'),
        uglify(),
        gulp.dest('../javascriptM/toc/build/agsjs/dijit')
    ], err);
});

gulp.task('disclaimer', ['disclaimerD', 'disclaimerM']);
gulp.task('errorBox', ['errorBoxD', 'errorBoxM']);
gulp.task('findPlace', ['findPlaceD', 'findPlaceM']);
gulp.task('hb1298', ['hb1298D', 'hb1298M']);
gulp.task('identify', ['identifyD', 'identifyM']);
gulp.task('readConfig', ['readConfigD', 'readConfigM']);
gulp.task('search', ['searchD', 'searchM']);
gulp.task('print', ['printD', 'printM']);
gulp.task('bookmark', ['bookmarkD', 'BookmarkM']);
gulp.task('utilFuncs', ['utilFuncsD', 'utilFuncsM']);
gulp.task('xmlUtils', ['xmlUtilsD', 'xmlUtilsM']);
gulp.task('toc', ['tocD', 'tocM']);
gulp.task('TOC', ['tocD', 'tocM']);