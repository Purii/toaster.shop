import pkg from './package.json';
import gulp from 'gulp';

/**
 * Load all gulp plugins automatically
 * Call via plugins().[plugin]
 */
import plugins from 'gulp-load-plugins';

/**
 * Constants
 */
const config = pkg['config'];

/**
 * Copy tasks
 */
gulp.task('copy', [
	'copy:.htaccess',
  'copy:misc',
]);

gulp.task('copy:.htaccess', () =>
    gulp.src('node_modules/apache-server-configs/dist/.htaccess')
        .pipe(plugins().replace(/# ErrorDocument/g, 'ErrorDocument'))
        .pipe(gulp.dest(config.dirs.dist))
);

gulp.task('copy:misc', () =>
  gulp.src([
    // Copy all files
    `${config.dirs.src}/**/*`,

    // Exclude the following files
    // (other tasks will handle the copying of these files)
    `!${config.dirs.src}/css{,/**/*}`,
    
    ], {
    // Include hidden files by default
    dot: true
  }).pipe(gulp.dest(config.dirs.dist))
);


/**
 * CSS tasks
 */
gulp.task('css', () =>
  gulp.src(`${config.dirs.src}/css/*.css`)

    // Cleanup
    .pipe(plugins().uncss({
      html: [`${config.dirs.src}/index.html`],
    }))

    // Postcss
    .pipe(plugins().postcss([
      require("postcss-import")(),
      require("postcss-url")(),
      require("postcss-cssnext")({
        browsers: ['last 2 version']
      }),
      require('cssnano')({autoprefixer: false,}),
      // require("postcss-browser-reporter")(),
      require("postcss-reporter")(),
    ]))

    // Write files
    .pipe(gulp.dest(`${config.dirs.dist}/css`))
);


/**
 * Define CLI tasks
 */
gulp.task('build', ['copy', 'css'])
gulp.task('default', ['build']);

