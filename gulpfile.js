const gulp = require("gulp");
const concat = require("gulp-concat");
const autoprefixer = require("gulp-autoprefixer");
const htmlmin = require("gulp-htmlmin");
const cleanCSS = require("gulp-clean-css");
const uglify = require("gulp-uglify");
const del = require("del");
const uncss = require("gulp-uncss");
const csso = require("gulp-csso");
const csscomb = require("gulp-csscomb");
const imagemin = require("gulp-imagemin");
const image = require("gulp-image");
const smartgrid = require("smart-grid");
const browserSync = require("browser-sync").create();
const gcmq = require("gulp-group-css-media-queries");
const sourcemaps = require("gulp-sourcemaps");
const fileinclude = require("gulp-file-include");
const webpack = require("webpack-stream");
const gulpif = require("gulp-if");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
sass.compiler = require("node-sass");

const isDev = process.argv.indexOf("--dev") !== -1;
const isProd = !isDev;

const conf = {
  dest: "./dist",
};

const htmlFiles = ["./src/**/*.html"];
const cssFiles = [
  "./node_modules/normalize.css/normalize.css",
  "./src/sass/**/*.scss",
];
const jsFiles = ["./src/js/**/*.js"];
const imagesFiles = ["./src/img/**/*"];
const fontsFiles = ["./src/fonts/**/*"];

let webConfig = {
  output: {
    filename: "all.js",
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: "babel-loader",
      exclude: "/node_modules/",
    }, ],
  },
  mode: isDev ? "development" : "production",
  devtool: isDev ? "eval-source-map" : "none",
};

function html() {
  return gulp
    .src("./src/index.html")
    .pipe(concat("index.html"))
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulp.dest(conf.dest))
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
      })
    )
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest(conf.dest))
    .pipe(browserSync.stream());
}

function styles() {
  return gulp
    .src(cssFiles)
    .pipe(concat("all.css"))
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(sass.sync().on("error", sass.logError))
    .pipe(
      uncss({
        html: htmlFiles,
      })
    )
    .pipe(csscomb())
    .pipe(csso())
    .pipe(gcmq())
    .pipe(
      autoprefixer({
        browsers: ["> 0.1%"],
        cascade: false,
      })
    )
    .pipe(gulp.dest(conf.dest + "/css"))
    .pipe(csscomb())
    .pipe(csso())
    .pipe(
      gulpif(
        isProd,
        cleanCSS({
          level: 2,
        })
      )
    )
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulpif(isProd, sourcemaps.write()))
    .pipe(gulp.dest(conf.dest + "/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp
    .src(jsFiles)
    .pipe(webpack(webConfig))
    .pipe(uglify())
    .pipe(gulp.dest(conf.dest + "/js"))
    .pipe(browserSync.stream());
}

function images() {
  return gulp
    .src(imagesFiles)
    .pipe(
      imagemin({
        progressive: true,
      })
    )
    .pipe(image())
    .pipe(gulp.dest(conf.dest + "/img"));
}

function fonts() {
  return gulp.src(fontsFiles).pipe(gulp.dest(conf.dest + "/fonts"));
}

function watch() {
  browserSync.init({
    server: {
      baseDir: conf.dest,
    },
  });

  gulp.watch(htmlFiles, html);
  gulp.watch(cssFiles[1], styles);
  gulp.watch(jsFiles, scripts);
  gulp.watch(imagesFiles, images);
  gulp.watch(fontsFiles, fonts);
}

function clean() {
  return del([conf.dest + "/*"]);
}

gulp.task("html", html);
gulp.task("styles", styles);
gulp.task("scripts", scripts);
gulp.task("images", images);
gulp.task("fonts", fonts);
gulp.task("watch", watch);

function grid(done) {
  let settings = {
    columns: 12,
    outputStyle: "scss",
    offset: "10px",
    container: {
      maxWidth: "1000px",
      fields: "30px",
    },
    breakPoints: {
      lg: {
        width: "1200px",
      },
      md: {
        width: "992px",
        fields: "15px",
      },
      sm: {
        width: "768px",
      },
      xs: {
        width: "576px",
      },
    },
  };

  smartgrid("./src/sass", settings);
  done();
}

let build = gulp.series(
  clean,
  gulp.parallel(html, styles, scripts, images, fonts)
);

gulp.task("build", build);
gulp.task("dev", gulp.series("build", "watch"));
gulp.task("grid", grid);