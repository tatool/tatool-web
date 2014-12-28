var gulp = require('gulp'),
clean = require('gulp-clean'),
del = require('del'),
concat = require('gulp-concat'),
rename = require('gulp-rename'),
jshint = require('gulp-jshint'),
uglify = require('gulp-uglify'),
minifyCSS = require('gulp-minify-css'),
notify = require('gulp-notify'),
usemin = require('gulp-usemin');

// tasks
gulp.task('clean', function(cb) {
    del(['./dist/*'], cb);
});

gulp.task('lint', function() {
  gulp.src(['./app/scripts/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('minify-css-app', ['clean'], function() {
  gulp.src(['./app/styles/reset.css', './app/styles/tatool_app.css', './app/styles/tatool_auth.css'])
    .pipe(concat('tatool-app.css'))
    .pipe(gulp.dest('./dist/styles/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./dist/styles/'))
});

gulp.task('minify-css-module', ['clean'], function() {
  gulp.src(['./app/styles/reset.css', './app/styles/tatool_module.css'])
    .pipe(concat('tatool-module.css'))
    .pipe(gulp.dest('./dist/styles/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./dist/styles/'))
});

gulp.task('minify-js-app', ['clean'], function() {
  gulp.src(['app/scripts/modules/app.js', 
        'app/scripts/modules/common.module.js',
        'app/scripts/modules/auth.module.js',
        'app/scripts/modules/app.module.js', 
        'app/scripts/*.js', 
        'app/scripts/common/*.js',
        'app/scripts/app/*.js',
        'app/scripts/auth/*.js'
        ])
    .pipe(concat('tatool-app.js'))
    .pipe(gulp.dest('./dist/scripts'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/scripts'))
});

gulp.task('minify-js-module', ['clean'], function() {
  gulp.src(['app/scripts/modules/app.js', 
        'app/scripts/modules/common.module.js',
        'app/scripts/modules/auth.module.js',
        'app/scripts/modules/module.module.js', 
        'app/scripts/*.js', 
        'app/scripts/common/*.js',
        'app/scripts/module/util/*.js',
        'app/scripts/auth/*.js',
        'app/scripts/module/*.js'
        ])
    .pipe(concat('tatool-module.js'))
    .pipe(gulp.dest('./dist/scripts'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/scripts'))
});

gulp.task('copy-bower-components', ['clean'], function () {
  gulp.src('./app/bower_components/**')
    .pipe(gulp.dest('./dist/bower_components'));
});

gulp.task('copy-images', ['clean'], function () {
  gulp.src('./app/images/**')
    .pipe(gulp.dest('./dist/images'));
});

gulp.task('copy-views', ['clean'], function () {
  gulp.src(['./app/views/**/*.html', '!./app/views/module/index.html'])
    .pipe(gulp.dest('./dist/views'));
});

gulp.task('copy-projects', ['clean'], function () {
  gulp.src('./app/projects/**')
    .pipe(gulp.dest('./dist/projects'));
});

gulp.task('copy-js', ['clean'], function () {
  gulp.src('./app/scripts/common/util/*.js')
    .pipe(gulp.dest('./dist/scripts/common/util/'));
});

gulp.task('copy-css', ['clean'], function () {
  gulp.src('./app/styles/prism.css')
    .pipe(gulp.dest('./dist/styles/'));
});

gulp.task('copy-icons', ['clean'], function () {
  gulp.src('./app/styles/font-awesome/**/*')
    .pipe(gulp.dest('./dist/styles/font-awesome/'));
});

gulp.task('copy-fonts', ['clean'], function () {
  gulp.src('./app/fonts/**')
    .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('usemin-app', ['clean'], function() {
  gulp.src('./app/index.html')
    .pipe(usemin({
      css: [minifyCSS(), 'concat'],
      js: [uglify(), 'concat']
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('usemin-module', ['clean'], function() {
  gulp.src('./app/views/module/index.html')
    .pipe(usemin({
      css: [minifyCSS(), 'concat'],
      js: [uglify(), 'concat']
    }))
    .pipe(gulp.dest('./dist/views/module/'));
});

// default task only running jshint
gulp.task('default',
  ['lint']
);

// build task
gulp.task('build',
  ['lint', 'minify-css-app', 'minify-css-module', 'minify-js-app', 'minify-js-module',
  'copy-bower-components', 'copy-images', 'copy-views', 'copy-projects', 'copy-fonts', 'copy-css', 'copy-js', 'copy-icons',
  'usemin-app', 'usemin-module' ]
);
