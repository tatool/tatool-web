var gulp = require('gulp'),
del = require('del'),
concat = require('gulp-concat'),
rename = require('gulp-rename'),
jshint = require('gulp-jshint'),
uglify = require('gulp-uglify'),
cssnano = require('gulp-cssnano'),
notify = require('gulp-notify'),
usemin = require('gulp-usemin');

// tasks
gulp.task('clean', function(cb) {
    del(['./dist/*'], cb);
});

gulp.task('lint', ['clean'], function() {
  return gulp.src(['./app/scripts/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('usemin-app', ['clean'], function() {
  return gulp.src('./app/index.html')
    .pipe(usemin({
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('usemin-module', ['clean','usemin-app'], function() {
  return gulp.src('./app/views/module/index.html')
    .pipe(usemin({
    }))
    .pipe(gulp.dest('./dist/views/module/'));
});

gulp.task('minify-css-app', ['usemin-module'], function() {
  return gulp.src(['./app/styles/reset.css', './app/styles/tatool_app.css', './app/styles/tatool_auth.css'])
    .pipe(concat('tatool-app.css'))
    .pipe(cssnano({zindex: false}).on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/styles/'))
});

gulp.task('minify-css-module', ['usemin-module'], function() {
  return gulp.src(['./app/styles/reset.css', './app/styles/tatool_module.css'])
    .pipe(concat('tatool-module.css'))
    .pipe(cssnano({zindex: false}).on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/styles/'))
});

gulp.task('minify-js-app', ['usemin-module'], function() {
  return gulp.src(['app/scripts/modules/app.js', 
        'app/scripts/modules/common.module.js',
        'app/scripts/modules/auth.module.js',
        'app/scripts/modules/app.module.js', 
        'app/scripts/*.js', 
        'app/scripts/common/*.js',
        'app/scripts/app/*.js',
        'app/scripts/auth/*.js'
        ])
    .pipe(concat('tatool-app.js'))
    .pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/scripts'))
});

gulp.task('minify-js-module', ['usemin-module'], function() {
  return gulp.src(['app/scripts/modules/app.js', 
        'app/scripts/modules/common.module.js',
        'app/scripts/modules/auth.module.js',
        'app/scripts/modules/module.module.js', 
        'app/scripts/module.data.service.js', 
        'app/scripts/trial.data.service.js', 
        'app/scripts/user.data.service.js', 
        'app/scripts/common/*.js',
        'app/scripts/module/util/*.js',
        'app/scripts/auth/*.js',
        'app/scripts/module/*.js'
        ])
    .pipe(concat('tatool-module.js'))
    .pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/scripts'))
});

gulp.task('minify-js-vendor', ['usemin-module'], function() {
  return gulp.src([
        'app/bower_components/jquery-ui/jquery-ui.js',
        'app/bower_components/angular-animate/angular-animate.js',
        'app/bower_components/angular-base64/angular-base64.js',
        'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'app/bower_components/angular-progress-arc/angular-progress-arc.js',
        'app/bower_components/angular-resource/angular-resource.js',
        'app/bower_components/angular-route/angular-route.js',
        'app/bower_components/angular-sanitize/angular-sanitize.js',
        'app/bower_components/angular-ui-router/release/angular-ui-router.js',
        'app/bower_components/angular-ui-select/dist/select.js',
        'app/bower_components/json3/lib/json3.js',
        'app/bower_components/bootstrap/dist/js/bootstrap.js',
        'app/bower_components/bootbox/bootbox.js',
        'app/bower_components/idb-wrapper/idbstore.js',
        'app/bower_components/screenfull/dist/screenfull.js',
        'app/bower_components/spin.js/spin.js',
        'app/bower_components/headjs/dist/1.0.0/head.js',
        'app/bower_components/papaparse/papaparse.js',
        'app/bower_components/datejs/build/production/date.js',
        'app/bower_components/script.js/dist/script.js',
        'app/bower_components/lz-string/libs/lz-string.min.js',
        'app/bower_components/async/lib/async.js',
        'app/bower_components/jqueryui-touch-punch/jquery.ui.touch-punch.js',
        'app/scripts/common/util/prism.js',
        'app/scripts/common/util/uuid.js',
        'app/scripts/common/util/sha1.js',
        'app/scripts/common/util/download.js'
        ])
    .pipe(concat('vendor.js'))
    .pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/scripts/vendor'))
});


gulp.task('copy-bower-components', ['usemin-module'], function () {
  return gulp.src('./app/bower_components/**')
    .pipe(gulp.dest('./dist/bower_components'));
});

gulp.task('copy-images', ['usemin-module'], function () {
  return gulp.src('./app/images/**')
    .pipe(gulp.dest('./dist/images'));
});

gulp.task('copy-views', ['usemin-module'], function () {
  return gulp.src(['./app/views/**/*.html', '!./app/views/module/index.html'])
    .pipe(gulp.dest('./dist/views'));
});

gulp.task('copy-projects', ['usemin-module'], function () {
  return gulp.src('./app/projects/**')
    .pipe(gulp.dest('./dist/projects'));
});

gulp.task('copy-js-vendor', ['usemin-module'], function () {
  return gulp.src(['./app/bower_components/angular/angular.min.js',
      './app/bower_components/jquery/dist/jquery.min.js',
      './app/bower_components/video.js/dist/video.min.js'])
    .pipe(gulp.dest('./dist/scripts/vendor/'));
});

gulp.task('copy-css-vendor', ['usemin-module'], function () {
  return gulp.src(['./app/bower_components/angular-ui-select/dist/select.min.css',
      './app/bower_components/bootstrap/dist/css/bootstrap.min.css',
      './app/styles/prism.css',
      './app/bower_components/video.js/dist/video-js.min.css'])
    .pipe(gulp.dest('./dist/styles/vendor/'));
});

// stand-alone copy required due to bug which would leave the target file empty!
gulp.task('copy-css-select', ['usemin-module'], function () {
  return gulp.src(['./app/bower_components/angular-ui-select/dist/select.min.css'])
    .pipe(gulp.dest('./dist/styles/vendor/'));
});

gulp.task('copy-icons', ['usemin-module'], function () {
  return gulp.src('./app/styles/font-awesome/**/*')
    .pipe(gulp.dest('./dist/styles/font-awesome/'));
});

gulp.task('copy-fonts', ['usemin-module'], function () {
  return gulp.src('./app/fonts/**')
    .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('copy-video-fonts', ['usemin-module'], function () {
  return gulp.src('./app/bower_components/video.js/dist/font/*')
    .pipe(gulp.dest('./dist/styles/vendor/font/'));
});

// default task only running jshint
gulp.task('default',
  ['lint']
);

// build task
gulp.task('build',
  ['lint', 'minify-css-app', 'minify-css-module', 'minify-js-app', 'minify-js-module', 'minify-js-vendor',
  'copy-bower-components', 'copy-images', 'copy-views', 'copy-projects', 'copy-fonts', 'copy-video-fonts', 'copy-css-vendor', 'copy-css-select', 'copy-js-vendor', 'copy-icons',
  'usemin-app', 'usemin-module' ]
);
