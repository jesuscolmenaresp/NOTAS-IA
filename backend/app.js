var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRoutes = require('./routes/auth');  // 💬 Esto ya es correcto
const notesRoutes = require('./routes/notes');
const filesRoutes = require('./routes/files');

var app = express();   // ✅ Primero creamos la app

require('./config/database'); // ✅ Ahora sí ejecutamos la conexión (después de tener app)

const session = require('express-session');
app.use(session({
  secret: 'notasia-secret-key', // puedes poner cualquier frase secreta
  resave: false,
  saveUninitialized: true,
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', authRoutes);  // ✅ Ahora sí usamos authRoutes
app.use('/', notesRoutes);
app.use('/', filesRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
