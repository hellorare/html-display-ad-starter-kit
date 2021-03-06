// ==========================================================================
//
//  HTML Ad Build Tools
//
// ==========================================================================

var gulp						= require('gulp'),
		plugins					= require('gulp-load-plugins')(),
		mainBowerFiles	= require('main-bower-files'),
		moment					= require('moment'),
		opn							= require('opn'),
		del							= require('del'),
		fs							= require('fs'),
		path 						= require('path'),
		merge 					= require('merge-stream'),
		slug 						= require('slug'),
		glob 						= require('glob');


// --------------------------------------------------------------------------
//   Configuration
// --------------------------------------------------------------------------

var config = {
			source:  	  './source',
			assets:   './assets',
			build: 	  './build',
			packages: './package',
			templates:'./templates',
			name:		  'Display'
}


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
		config.packages
	]);
});


// --------------------------------------------------------------------------
//   Remove all sketch build files
// --------------------------------------------------------------------------

gulp.task('clean-sketch', function () {
	return del.sync([
		path.join(config.assets, 'build'),
		path.join(config.assets, 'temp')
	]);
});


// --------------------------------------------------------------------------
//   Compile Sketch Assets
// --------------------------------------------------------------------------

gulp.task('extract-assets', ['clean-sketch'], function() {

	var sketches = glob.sync( path.join(config.assets, '/**/*.sketch') );

	sketches.forEach( function (sketch) {
		var basename = sketch.match(/\/(.*).sketch/);
		basename = slug(basename[1]);

		return gulp.src(sketch)
			.pipe(plugins.sketch({
				export: 'slices',
				formats: 'png',
				saveForWeb: true,
				scales: 1.0,
				trimmed: false
			}))
			.pipe( plugins.rename(function (path) {
				path.basename = slug(path.basename);
			}))
			.pipe( gulp.dest(path.join( config.assets, 'temp', basename )) )
			.pipe(plugins.spritesmith({
				imgName: basename + '.png',
				cssName: basename + '.html',
				cssTemplate: path.join(config.templates, 'sprite.hbs')
			}))
			.pipe( gulp.dest( path.join( config.assets, 'build') ) )
	});

});


// --------------------------------------------------------------------------
//   Compile
// --------------------------------------------------------------------------

gulp.task('compile', function (done) {

	return gulp.src( path.join(config.source, '/**/publish/web/**/*') )
		.pipe( gulp.dest( config.build ) );

});


// --------------------------------------------------------------------------
//   Enable HTTPS
// --------------------------------------------------------------------------

gulp.task('https', ['compile'], function (done) {

	return gulp.src( path.join(config.build, '/**/*.html') )
		.pipe( plugins.replace('src="http://', 'src="https://') )
		.pipe( gulp.dest( config.build ) );

});


// --------------------------------------------------------------------------
//   Compile preview
// --------------------------------------------------------------------------

gulp.task('preview', ['clean', 'compile', 'compress-js', 'https', 'trim-eas'], function (done) {

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
//   Compress Images
// --------------------------------------------------------------------------

gulp.task('smush', function () {

	var tinypngConfig = {
				key: 'K2H6n0IWE3_SjnxbVdIRYt6XkxpC41_f',
				checkSigs: true,
				sigFile: './.smush-sigs',
				log: true
			}

	return gulp.src( path.join(config.source, '/**/*.{png,jpg}') )
		.pipe( plugins.tinypngCompress( tinypngConfig) )
		.pipe( gulp.dest( config.source ) );

});


// --------------------------------------------------------------------------
//   Trim EAS Files
// --------------------------------------------------------------------------

gulp.task('trim-eas', ['compile'], function () {

	return del.sync([
		path.join(config.build, '/**/*.eas')
	]);

});


// --------------------------------------------------------------------------
//   Deploy Staging
// --------------------------------------------------------------------------

gulp.task('deploy', function() {

	var gulpSSH = new plugins.ssh({
		ignoreErrors: false,
		sshConfig: {
			host: 'staging.hellorare.com',
			username: 'root',
			privateKey: fs.readFileSync(process.env.HOME + '/.ssh/id_rsa')
		}
	});

	return gulp.src( path.join(config.packages, 'Preview/**/*') )
		.pipe( gulpSSH.dest( path.join('/var/www/ads', slug(config.name)), { autoExit: true }))
		.pipe( opn( path.join('http://staging.hellorare.com/ads/', slug(config.name)) ) )

});


// --------------------------------------------------------------------------
//   Sketch compile
// --------------------------------------------------------------------------

gulp.task('sketch', [ 'clean-sketch', 'extract-assets' ]);


// --------------------------------------------------------------------------
//   Build
// --------------------------------------------------------------------------

gulp.task('build', [ 'clean', 'compile', 'compress-js', 'https', 'trim-eas', 'preview', 'zip' ]);
