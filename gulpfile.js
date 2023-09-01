/* eslint-disable @typescript-eslint/no-require-imports */
const gulp = require('gulp');
const del = require('del');
const changed = require('gulp-changed');
const gulpTs = require('gulp-typescript');
const gulpIf = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const gulpLess = require('gulp-less');
const rename = require('gulp-rename');
const cache = require('gulp-cache');
const mpNpm = require('gulp-mp-npm');
const preprocess = require('gulp-preprocess');
const tsProject = gulpTs.createProject('./tsconfig.json');

/* config */
const isDev = process.argv.indexOf('--develop') >= 0;
const src = 'src';
const demoSrc = 'tools/demo'
const typings = 'typings';
const demoDist = 'miniprogram_dev';
const dist = isDev ? `${demoDist}/components/mp-user-avatar` : 'miniprogram_dist';

const sourcemap = {
  ts: true, // 是否开启 ts sourcemap
  less: false, // 是否开启 less sourcemap
};

// options
const srcOptions = { base: src };
const watchOptions = { events: ['add', 'change'] };
const mpNpmOptions = { npmDirname: 'node_modules' };

// 文件匹配路径
const globs = {
  ts: [`${src}/**/*.ts`, `${typings}/**/*.ts`], // 匹配 ts 文件
  js: `${src}/**/*.js`, // 匹配 js 文件
  json: `${src}/**/*.json`, // 匹配 json 文件
  less: `${src}/**/*.less`, // 匹配 less 文件
  wxss: `${src}/**/*.wxss`, // 匹配 wxss 文件
  image: `${src}/**/*.{png,jpg,jpeg,gif,svg}`, // 匹配 image 文件
};
globs.copy = [`${src}/**`,
  `!${globs.ts[0]}`, `!${globs.ts[1]}`, `!${globs.js}`, `!${globs.json}`,
  `!${globs.less}`, `!${globs.wxss}`]; // 匹配需要拷贝的文件

// 包装 gulp.lastRun, 引入文件 ctime 作为文件变动判断另一标准
// https://github.com/gulpjs/vinyl-fs/issues/226
const since = task => (
  file => (gulp.lastRun(task) > file.stat.ctime ? gulp.lastRun(task) : 0)
);

/** `gulp clear`
 * 清理文件
 * */
const clear = () => del(isDev ? demoDist : dist);

/** `gulp clearCache`
 * 清理缓存
 * */
const clearCache = () => cache.clearAll();

/** `gulp copy`
 * 清理
 * */
const copy = () => gulp.src(
  globs.copy,
  { ...srcOptions, since: since(copy) },
)
  .pipe(changed(dist)) // 过滤掉未改变的文件
  .pipe(gulp.dest(dist));

/** `gulp copy type`
 * 拷贝
 * */
const copyType = () => gulp.src(
  `${typings}/**`,
  { base: typings, since: since(copy) },
)
  .pipe(changed(dist)) // 过滤掉未改变的文件
  .pipe(gulp.dest(dist));

/** `gulp copy demo`
 * 拷贝
 * */
const copyDemo = () => gulp.src(
  `${demoSrc}/**`,
  { base: demoSrc, since: since(copy) },
)
  .pipe(changed(demoDist)) // 过滤掉未改变的文件
  .pipe(gulp.dest(demoDist));

/** `gulp ts`
 * 编译ts
 * */
const ts = () => gulp.src(
  globs.ts,
  srcOptions,
)
  .pipe(preprocess({
    context: {
      NODE_ENV: process.env.NODE_ENV,
    },
  }))
  .pipe(gulpIf(sourcemap.ts, sourcemaps.init()))
  .pipe(tsProject()) // 编译ts
  .pipe(gulpIf(sourcemap.ts, sourcemaps.write('.')))
  .pipe(changed(dist, { hasChanged: changed.compareContents })) // 过滤掉未改变的文件
  .pipe(mpNpm(mpNpmOptions)) // 分析依赖
  .pipe(gulp.dest(dist));

/** `gulp js`
 * 解析js
 * */
const js = () => gulp.src(
  globs.js,
  { ...srcOptions, since: since(js) },
)
  .pipe(mpNpm(mpNpmOptions)) // 分析依赖
  .pipe(gulp.dest(dist));

/** `gulp json`
 * 解析json
 * */
const json = () => gulp.src(
  globs.json,
  { ...srcOptions, since: since(json) },
)
  .pipe(mpNpm(mpNpmOptions)) // 分析依赖
  .pipe(gulp.dest(dist));

/** `gulp less`
 * 编译less
 * */
const less = () => gulp.src(
  globs.less,
  { ...srcOptions, since: since(less) },
)
  .pipe(gulpIf(sourcemap.less, sourcemaps.init()))
  .pipe(gulpLess()) // 编译less
  .pipe(rename({ extname: '.wxss' }))
  .pipe(gulpIf(sourcemap.less, sourcemaps.write('.')))
  .pipe(mpNpm(mpNpmOptions)) // 分析依赖
  .pipe(gulp.dest(dist));

/** `gulp wxss`
 * 解析wxss
 * */
const wxss = () => gulp.src(
  globs.wxss,
  { ...srcOptions, since: since(wxss) },
)
  .pipe(mpNpm(mpNpmOptions)) // 分析依赖
  .pipe(gulp.dest(dist));

// 不清理 dist 的构建
const buildWithoutDel = gulp.parallel(
  copy,
  ts,
  js,
  json,
  less,
  wxss,
);

/** `gulp build`
 * 构建
 * */
const build = gulp.series(
  gulp.parallel(clear),
  copyType,
  buildWithoutDel,
);

/** `gulp watch`
 * 监听
 * */
const watch = () => {
  gulp.watch(globs.copy, watchOptions, copy);
  gulp.watch(globs.ts, watchOptions, ts);
  gulp.watch(globs.js, watchOptions, js);
  gulp.watch(globs.json, watchOptions, json);
  gulp.watch(globs.less, watchOptions, less);
  gulp.watch(globs.wxss, watchOptions, wxss);
};

/** `gulp` or `gulp dev`
 * 构建并监听
 * */
const dev = gulp.series(
  clear,
  copyDemo,
  buildWithoutDel,
  watch,
);

// `gulp --tasks` list tasks
module.exports = {
  clear,
  clearCache,
  copy,
  ts,
  less,
  build,
  watch,
  dev,
  default: build,
  clean: clear,
};
