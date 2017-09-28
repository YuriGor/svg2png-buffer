import gulp from "gulp";
import babel from "gulp-babel";
import jasmine from "gulp-jasmine";
import eslint from "gulp-eslint";
import del from "del";

gulp.task('clean', () => del(['index.js']));

gulp.task('build', ['clean'], () => {
    return gulp.src('src/index.js')
        .pipe(babel())
        .pipe(gulp.dest('./'));
});

gulp.task('watch', ['build'], () => {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['build']);