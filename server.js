// server
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

// server setup
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('jwt_secret', process.env.JWT_SECRET || 'secret');

// dependencies
var userController = require('./controllers/user');
var userModuleController = require('./controllers/userModule');
var repoModuleController = require('./controllers/repository');
var developerModuleController = require('./controllers/developerModule');
var authController = require('./controllers/auth')
var adminController = require('./controllers/admin');

// db
mongoose.connect( process.env.MONGOLAB_URI || 'mongodb://localhost/tatool-web' );

//logging setup
app.use(logger('dev'));

// parse json and urlencoded body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use passport package
app.use(passport.initialize());


// API router
var router = express.Router();

// User Modules
router.post('/user/modules/:moduleId', userModuleController.addModule);
router.get('/user/modules/:moduleId', userModuleController.getModule);
router.delete('/user/modules/:moduleId', userModuleController.removeModule);
router.get('/user/modules', userModuleController.getModules);
router.post('/user/modules/:moduleId/trials/:sessionId', userModuleController.addTrials);

// Repository Modules
router.get('/user/repository', repoModuleController.getRepositoryEntries);
router.get('/user/repository/:moduleId', repoModuleController.getRepositoryEntry);

// Developer Modules
router.post('/developer/modules/:moduleId', developerModuleController.addModule);
router.get('/developer/modules/:moduleId', developerModuleController.getModule);
router.delete('/developer/modules/:moduleId', developerModuleController.removeModule);
router.get('/developer/modules', developerModuleController.getModules);
router.post('/developer/modules/:moduleId/trials/:sessionId', developerModuleController.addTrials);
router.post('/developer/modules/:moduleId/publish', developerModuleController.publishModule);
router.get('/developer/modules/:moduleId/unpublish', developerModuleController.unpublishModule);

// Admin
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users/:user', adminController.updateUser);
router.delete('/admin/users/:user', adminController.removeUser);

// User
router.get('/user/roles', authController.getRoles);
router.post('/register', userController.register);
router.get('/login', 
  function(req, res, next) {
    authController.isAuthenticated(req, res, next, app.get('jwt_secret'));
  });

// protect api with JWT
app.use('/api', expressJwt({secret: app.get('jwt_secret')}).unless({path: ['/api/login','/api/register']}), authController.hasRole, router);

app.post('/user/verify/resend', userController.verifyResend);
app.get('/user/verify/:token', userController.verifyUser);
app.post('/user/reset', userController.resetPasswordSend);
app.get('/user/resetverify/:token', userController.verifyResetToken);
app.post('/user/reset/:token', userController.updatePassword);
app.post('/user/captcha', userController.verifyCaptcha);

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