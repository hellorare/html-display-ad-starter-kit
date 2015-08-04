// ==========================================================================
//
//  Static Site Build Tools
//
// ==========================================================================

var gulp						= require('gulp'),
		plugins					= require('gulp-load-plugins')(),
		mainBowerFiles	= require('main-bower-files'),
		reload					= browserSync.reload,
		moment					= require('moment'),
		opn							= require('opn'),
		del							= require('del'),
		fs							= require('fs');


// --------------------------------------------------------------------------
//   Configuration
// --------------------------------------------------------------------------

var config = {
		source: './source',
		build: 	'./build',
		name:		'static-site'
}


// --------------------------------------------------------------------------
//   Remove all existing compiled files
// --------------------------------------------------------------------------

gulp.task('clean', function () {
	return del.sync([
		config.build
	]);
});


// --------------------------------------------------------------------------
//   Browser Sync
// --------------------------------------------------------------------------

gulp.task('browser-sync', function() {

	return browserSync({
		proxy: 'localhost:9000'
	});

});


// --------------------------------------------------------------------------
//   Compile
// --------------------------------------------------------------------------

gulp.task('compile', function (done) {



});


// --------------------------------------------------------------------------
//   Compress JS
// --------------------------------------------------------------------------

gulp.task('compress', ['compile'], function () {

	return gulp.src( config.build + '/**/*.js' )
		.pipe( plugins.uglify() )
		.pipe( gulp.dest(config.build) );

});


// --------------------------------------------------------------------------
//   Package
// --------------------------------------------------------------------------

gulp.task('package', ['compress'], function () {

	return gulp.src( config.build + '/**/*' )
		.pipe(plugins.zip(moment().format() + '.zip'))
		.pipe(gulp.dest('./packages/'));

});


// --------------------------------------------------------------------------
//   Deploy Staging
// --------------------------------------------------------------------------

gulp.task('deploy-staging', function() {

	var gulpSSH = new plugins.ssh({
		ignoreErrors: false,
		sshConfig: {
			host: 'staging.hellorare.com',
			username: 'root',
			privateKey: fs.readFileSync(process.env.HOME + '/.ssh/id_rsa')
		}
	});

	return gulp.src( config.build + '/**/*' )
		.pipe( gulpSSH.dest( '/var/www/' + config.name, { autoExit: true }))

});


// --------------------------------------------------------------------------
//   Watch
// --------------------------------------------------------------------------

gulp.task('watch', function () {

	// gulp.watch( config.source + '/**/*.{jade,ejs,html,haml,sass,scss,less,styl,md,coffee}').on('change', reload);

	// gulp.watch( config.source + '/**/*.{js,coffee}', ['bower-scripts'])

	// gulp.watch( 'bower.json', ['bower-scripts' , 'bower-styles', 'bower-fonts']);

});


// --------------------------------------------------------------------------
//   Default
// --------------------------------------------------------------------------

// gulp.task('default', [ 'serve', 'browser-sync', 'watch' ]);


// --------------------------------------------------------------------------
//   Build
// --------------------------------------------------------------------------

gulp.task('build', [ 'clean', 'compile', 'compress', 'package' ]);
