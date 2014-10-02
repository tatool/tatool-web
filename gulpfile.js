var gulp = require('gulp'),
clean = require('gulp-clean'),
concat = require('gulp-concat'),
rename = require('gulp-rename'),
jshint = require('gulp-jshint'),
uglify = require('gulp-uglify'),
minifycss = require('gulp-minify-css'),
notify = require('gulp-notify');


gulp.task('default', function() {
	var main = gulp.src('app/scripts/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
    .pipe(notify({ message: 'Scripts task complete' }));
	
	var main = gulp.src('app/scripts/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
    .pipe(notify({ message: 'Scripts task complete' }));
	
	return merge(main, vendor);
});

