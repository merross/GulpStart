// common
const gulp = require("gulp");
const plumber = require("gulp-plumber");
const gulpIf = require("gulp-if");

// clear task
const del = require("del");

// pug task
const pug = require("gulp-pug");

// scss task
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const minifyCss = require("gulp-clean-css");

//js
const webpack = require("webpack");
const gulpWebpack = require("webpack-stream");
const webpackConfig = require("./webpack.config.js");

//images
const imagemin = require("gulp-imagemin");

// server
const browserSync = require("browser-sync").create();

// svg-sprite
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");


const isProduction = process.env.NODE_ENV === "production";

const PATHS = {
	app: "./app",
	dist: "./dist"
};

gulp.task("clear", () => del(PATHS.dist));

gulp.task("templates", () => {
	return gulp
		.src(`${PATHS.app}/pages/**/*.pug`)
		.pipe(plumber())
		.pipe(pug({ pretty: true }))
		.pipe(gulp.dest(PATHS.dist));
});

gulp.task("styles", () => {
	return gulp
		.src(`${PATHS.app}/common/styles/app.scss`)
		.pipe(plumber())
		.pipe(gulpIf(!isProduction, sourcemaps.init()))
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(gulpIf(isProduction, minifyCss()))
		.pipe(gulpIf(!isProduction, sourcemaps.write()))
		.pipe(gulp.dest(`${PATHS.dist}/assets/styles`));
});

gulp.task("scripts", () => {
	return gulp
		.src(`${PATHS.app}/common/scripts/*.js`, { since: gulp.lastRun("scripts") })
		.pipe(plumber())
		.pipe(gulpWebpack(webpackConfig, webpack))
		.pipe(gulp.dest(`${PATHS.dist}/assets/scripts`));
});

gulp.task("images", () => {
	return gulp
		.src(`${PATHS.app}/common/images/**/*.+(png|jpg|jpeg|gif|svg|ico)`)
		.pipe(plumber())
		.pipe(gulpIf(isProduction, imagemin()))
		.pipe(gulp.dest(`${PATHS.dist}/assets/images`));
});

gulp.task("copy", () => {
    return gulp
        .src (`${PATHS.app}/common/fonts/**/*`)
        .pipe(plumber())
        .pipe(gulp.dest(`${PATHS.dist}/assets/fonts`));
});


gulp.task("icons", () => {
	return gulp
		.src(`${PATHS.app}/common/icons/**/*.svg`)
		.pipe(plumber())
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(
			svgSprite({
				mode: {
					symbol: {
						sprite: "../dist/assets/images/icons/sprite.svg",
						render: {
							scss: {
								dest:'../app/common/styles/helpers/sprites.scss',
								template: './app/common/styles/helpers/sprite-template.scss'
							}
						}
					}
				}
			})
		)
		.pipe(gulp.dest('./'));
});


gulp.task("server", () => {
	browserSync.init({
		server: PATHS.dist
	});
	browserSync.watch(PATHS.dist + "/**/*.*").on("change", browserSync.reload);
});

gulp.task("watch", () => {
	gulp.watch(`${PATHS.app}/**/*.pug`, gulp.series("templates"));
	gulp.watch(`${PATHS.app}/**/*.scss`, gulp.series("styles"));
	gulp.watch(`${PATHS.app}/**/*.js`, gulp.series("scripts"));
	gulp.watch(
		`${PATHS.app}/common/images/**/*.+(png|jpg|jpeg|gif|svg|ico)`,
		gulp.series("images")
	);
});

gulp.task(
	"default",
	gulp.series(
		gulp.parallel("templates", "icons", "styles", "scripts", "images", "copy"),
		gulp.parallel("watch", "server")
	)
);

gulp.task(
	"production",
	gulp.series(
		"clear",
		gulp.parallel("templates", "icons", "styles", "scripts", "images")
	)
);
