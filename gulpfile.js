// ==========================================================================
//
//  Static Site Build Tools
//
// ==========================================================================

var gulp						= require('gulp'),
		plugins					= require('gulp-load-plugins')(),
		mainBowerFiles	= require('main-bower-files'),
		browserSync			= require('browser-sync'),
		reload					= browserSync.reload,
		moment					= require('moment'),
		opn							= require('opn'),
		del							= require('del'),
		fs							= require('fs'),
		path 						= require('path'),
		merge 					= require('merge-stream');

// --------------------------------------------------------------------------
//   Configuration
// --------------------------------------------------------------------------

var config = {
			ads:  	  './source',
			common:   './common',
			build: 	  './build',
			packages: './package',
			templates:'./templates',
			name:		  'Display Ads'
}

var svgConfig = {
			mode : {
				css : {
					example: {
						template: './templates/sprite.moustache'
					},
					dest: '',
					bust: false,
					sprite: 'common.svg',
					dimensions: '-size',
					render: {
						css: false
					}
				}
			}
};

// --------------------------------------------------------------------------
//   Get array of folders in a directory
// --------------------------------------------------------------------------

function getFolders(dir) {
	return fs.readdirSync(dir)
		.filter(function(file) {
			return fs.statSync(path.join(dir, file)).isDirectory();
		});
}


// --------------------------------------------------------------------------
//   Remove all existing compiled files
// --------------------------------------------------------------------------

gulp.task('clean', function () {
	return del.sync([
		config.build,
		config.packages,
		path.join(config.common, '/build')
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
//   Compile Sketch Assets
// --------------------------------------------------------------------------

gulp.task('extract-svg', function() {

	console.log(svgConfig);

	return gulp.src( path.join(config.common, '/**/*.sketch') )
		.pipe( plugins.sketch({
			export: 'slices',
			formats: 'svg'
		}))
		.pipe( plugins.svgSprite( svgConfig ) )
		.pipe( gulp.dest( path.join( config.common, 'build') ));

});


// --------------------------------------------------------------------------
//   Minify Compiled SVG
// --------------------------------------------------------------------------

gulp.task('minify-svg', ['extract-svg'], function() {

	return gulp.src( path.join(config.common, '/**/*.svg') )
		.pipe( plugins.svgmin() )
		.pipe( gulp.dest( config.common ) );

});


// --------------------------------------------------------------------------
//   Compile
// --------------------------------------------------------------------------

gulp.task('compile', function (done) {

	return gulp.src( path.join(config.ads, '/**/publish/web/**/*') )
		.pipe( gulp.dest( config.build ) );

});


// --------------------------------------------------------------------------
//   Enable HTTPS
// --------------------------------------------------------------------------

gulp.task('https', function (done) {

	return gulp.src( path.join(config.build, '/**/*.html') )
		.pipe( plugins.replace('src="http://', 'src="https://') )
		.pipe( gulp.dest( config.build ) );

});


// --------------------------------------------------------------------------
//   Compile preview
// --------------------------------------------------------------------------

gulp.task('preview', ['clean', 'compile', 'compress-js', 'https'], function (done) {

	var folders = getFolders(config.build);

	var copy = folders.map(function(folder) {

		return gulp.src(path.join(config.build, folder, '/publish/web/**/*'))
			.pipe( gulp.dest( path.join(config.packages, 'Preview', folder) ));

	});

	var template = gulp.src( path.join(config.templates, 'list.moustache') )
		.pipe( plugins.mustache(
			{
				folders: folders,
				sizes: function() {
								return this.replace(/(\d*)x(\d*)/g, 'width="$1px" height="$2px"');
							}
			}
		))
		.pipe( plugins.rename('index.html'))
		.pipe( gulp.dest( path.join(config.packages, 'Preview') ));

	return merge(copy, template);

});


// --------------------------------------------------------------------------
//   Zip Packages
// --------------------------------------------------------------------------

gulp.task('zip', ['clean', 'compile', 'compress-js', 'https'], function (done) {

	var folders = getFolders(config.build);

	var tasks = folders.map(function(folder) {

		return gulp.src(path.join(config.build, folder, '/publish/web/**/*'))
			.pipe( plugins.zip( config.name + ' - ' + folder + '.zip') )
			.pipe( gulp.dest( path.join(config.packages, 'Revision - ' + moment().format('Do MMM YYYY, h.mma')) ));

	});

	return merge(tasks);

});


// --------------------------------------------------------------------------
//   Compress JS
// --------------------------------------------------------------------------

gulp.task('compress-js', ['compile'], function () {

	return gulp.src( path.join(config.build, '/**/*.js') )
		.pipe( plugins.uglify() )
		.pipe( gulp.dest(config.build) );

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

	return gulp.src( path.join(config.build, '/**/*') )
		.pipe( gulpSSH.dest( '/var/www/' + config.name, { autoExit: true }))

});


// --------------------------------------------------------------------------
//   Watch
// --------------------------------------------------------------------------

gulp.task('default', function () {

	gulp.watch( '**/*.sketch', ['clean', 'extract-svg', 'minify-svg']);

});


// --------------------------------------------------------------------------
//   Sketch compile
// --------------------------------------------------------------------------

gulp.task('sketch', [ 'clean', 'extract-svg', 'minify-svg' ]);


// --------------------------------------------------------------------------
//   Build
// --------------------------------------------------------------------------

gulp.task('build', [ 'clean', 'compile', 'compress-js', 'https', 'preview', 'zip' ]);
