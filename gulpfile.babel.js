import gulp from 'gulp';

/**
 * Load all gulp plugins automatically
 * Call via plugins().[plugin]
 */
import plugins from 'gulp-load-plugins';

import critical from 'critical';

import pkg from './package.json';

/**
 * Constants
 */
const config = pkg.config;
const env = process.env.NODE_ENV;

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
  gulp.src(
    [
      // Copy all files
      `${config.dirs.src}/**/*`,

      // Exclude the following files
      // (other tasks will handle the copying of these files)
      `!${config.dirs.src}/css{,/**/*}`,
      `!${config.dirs.src}/js{,/**/*}`,
      `!${config.dirs.src}/img{,/**/*}`,
      `!${config.dirs.src}/partials{,/**/*}`,
      `!${config.dirs.src}/*.html`,
    ],
    {
      // Include hidden files by default
      dot: true,
    }
  ).pipe(gulp.dest(config.dirs.dist))
);

gulp.task('img:dev', () =>
  gulp.src(`${config.dirs.src}/img/*`)
  .pipe(gulp.dest(`${config.dirs.build}/img`))
);

gulp.task('img:production', () =>
  gulp.src(`${config.dirs.src}/img/*`)
  .pipe(plugins().imagemin())
  .pipe(gulp.dest(`${config.dirs.dist}/img`))
);


/**
 * CSS tasks
 * Better separation!
 */
gulp.task('css:production', () =>
  gulp.src(`${config.dirs.src}/css/*.css`)

    // Cleanup
    .pipe(plugins().uncss({
      ignore: [/^.show-nav/, 'body.show-nav'],
      html: [`${config.dirs.src}/*.html`, `${config.dirs.src}/partials/*.html`],
    }))

    // Postcss
    .pipe(plugins().postcss([
      require('postcss-import')(),
      require('postcss-url')(),
      require('postcss-cssnext')({
        browsers: ['last 2 version'],
      }),
      require('postcss-custom-media')(),
      require('postcss-discard-comments')(),
      require('cssnano')({
        autoprefixer: false,
      }),
      require('postcss-reporter')(),
    ]))

    // Concat files
    .pipe(plugins().concat('bundle.css'))

    .pipe(plugins().rev())
    // Write file
    .pipe(gulp.dest(`${config.dirs.dist}/css`))
);

gulp.task('css:dev', () =>
  gulp.src(`${config.dirs.src}/css/*.css`)

    // Postcss
    .pipe(plugins().postcss([
      require('postcss-import')(),
      require('postcss-url')(),
      require('postcss-custom-media')(),
      require('postcss-browser-reporter')(),
    ]))

    // Write files
    .pipe(gulp.dest(`${config.dirs.build}/css`))
);


gulp.task('js:dev', () =>
  gulp.src(`${config.dirs.src}/js/*.js`)
    .pipe(plugins().babel())

    // Write files
    .pipe(gulp.dest(`${config.dirs.build}/js`))
);

gulp.task('js:production', () =>
  gulp.src(`${config.dirs.src}/js/*.js`)
    .pipe(plugins().babel({
      minified: true,
      comments: false,
    }))

    // Write files
    .pipe(gulp.dest(`${config.dirs.dist}/js`))
);

/**
 * HTML tasks
 */
gulp.task('html:production', ['css:production'], () =>
  gulp.src(`${config.dirs.src}/*.html`)

  // Inject partials
  .pipe(plugins().fileInclude({
    prefix: '@@',
    basepath: '@file',
  }))

  // Inject files
  .pipe(plugins().inject(gulp.src([`${config.dirs.dist}/css/*.css`, `${config.dirs.dist}/js/*.js`], { read: false }),
    {
      ignorePath: config.dirs.dist,
      relative: false,
      removeTags: true,
    }))
  // Compress
  .pipe(plugins().htmlmin({ collapseWhitespace: true }))

  // Write files
  .pipe(gulp.dest(config.dirs.dist))
);

gulp.task('html:dev', ['css:dev'], () =>
  gulp.src(`${config.dirs.src}/*.html`)

  // Inject partials
  .pipe(plugins().fileInclude({
    prefix: '@@',
    basepath: '@file',
  }))

  // Inject files
  .pipe(plugins().inject(gulp.src([`${config.dirs.build}/css/*.css`, `${config.dirs.build}/js/*.js`], { read: false }),
    {
      ignorePath: config.dirs.build,
      relative: false,
      removeTags: true,
    }))
  // Compress
  .pipe(plugins().htmlmin({ collapseWhitespace: true }))

  // Write files
  .pipe(gulp.dest(config.dirs.build))
);

// Generate & Inline Critical-path CSS
gulp.task('critical', ['html:production'], () =>
  gulp.src(`${config.dirs.dist}/*.html`)
    .pipe(critical.stream({
      base: config.dirs.dist,
      inline: true,
      minify: true,
    }))
    .pipe(gulp.dest('dist'))
);

/**
 * Define CLI tasks
 */
gulp.task('build:development',
  [
    'img:dev',
    'html:dev',
    'css:dev',
    'js:dev',
  ]
);
gulp.task('build:production',
  [
    'img:production',
    'html:production',
    'css:production',
    'js:production',
    'copy',
    'critical',
  ]
);

if (env === 'production') {
  gulp.task('default', ['build:production']);
} else {
  gulp.task('default', ['build:development']);
}

/**
 * Development Server
 */
gulp.task('watch', () => {
  gulp.src(config.dirs.build)
    .pipe(plugins().serverLivereload({
      host: '0.0.0.0',
      livereload: {
        enable: true,
        port: config.devServer.port,
      },
      directoryListing: {
        enable: true,
        path: './build',
      },
    }));

  // Write files to dist to trigger gulp.watch
  gulp.watch(`${config.dirs.src}/**/*.css`, ['css:dev']);
  gulp.watch(`${config.dirs.src}/**/*.html`, ['html:dev']);
  gulp.watch(`${config.dirs.src}/**/*.js`, ['js:dev']);
});
