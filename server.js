// server
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var userController = require('./controllers/user');
var moduleController = require('./controllers/module');
var authController = require('./controllers/auth')

// db
mongoose.connect( process.env.MONGOLAB_URI || 'mongodb://localhost/tatool-web' );

// server setup
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('jwt_secret', process.env.JWT_SECRET || 'secret');

console.log(app.get('jwt_secret'));

//logging setup
app.use(logger('dev'));

// parse json and urlencoded body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the passport package in our application
app.use(passport.initialize());


// API router
var router = express.Router();

router.post('/modules/:moduleId', moduleController.addModule);
router.get('/modules/:moduleId', moduleController.getModule);
router.delete('/modules/:moduleId', moduleController.removeModule);
router.get('/modules', moduleController.getModules);
router.post('/trials/:moduleId/:sessionId', moduleController.addTrials);

router.post('/register', userController.register);
router.get('/login', 
  function(req, res, next) {
    authController.isAuthenticated(req, res, next, app.get('jwt_secret'));
  });

// protect api with JWT
app.use('/api', expressJwt({secret: app.get('jwt_secret')}).unless({path: ['/api/login','/api/register']}), router);


// Tatool Web Client
app.use(express.static(path.join(__dirname, 'app')));

// redirect to index if no route matches
app.use(function(req, res, next){
  res.redirect('/');
});

// handle error case
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized access!' });
  }
});

// start server
app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});