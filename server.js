// server
var express = require('express');
//var compress = require('compression');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var favicon = require('serve-favicon');

// server setup
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('jwt_secret', process.env.JWT_SECRET || 'secret');
app.set('projects_path', process.env.PROJECTS_PATH || __dirname + '/app/projects/');
app.set('resource_user', process.env.RESOURCE_USER || 'tatool');
app.set('resource_pw', process.env.RESOURCE_PW || 'secret');
app.set('remote_url', process.env.REMOTE_URL);

// dependencies
var userController = require('./controllers/user');
var mainCtrl = require('./controllers/mainCtrl');
var repositoryCtrl = require('./controllers/repositoryCtrl');
var developerCtrl = require('./controllers/developerCtrl');
var authController = require('./controllers/auth')
var adminController = require('./controllers/admin');

// db
mongoose.connect( process.env.MONGOLAB_URI || 'mongodb://localhost/tatool-web' );

//logging setup
app.use(logger('dev'));

//compression
//app.use(compress());
app.use(favicon(__dirname + '/app/images/app/tatool_icon.ico'));

// parse json and urlencoded body
app.use(bodyParser.json( { limit: 1048576 })); // allow upload of 1MB
app.use(bodyParser.urlencoded({ extended: true }));

// Use passport package
app.use(passport.initialize());

// API router
var router = express.Router();

// User Modules
router.post('/user/modules/:moduleId/install', mainCtrl.install);
router.post('/user/modules/:moduleId', mainCtrl.save);
router.get('/user/modules', mainCtrl.getAll);
router.get('/user/modules/:moduleId', mainCtrl.get);
router.delete('/user/modules/:moduleId', mainCtrl.remove);
router.post('/user/modules/:moduleId/invite/:response', mainCtrl.processInvite);
router.post('/user/modules/:moduleId/trials/:sessionId', mainCtrl.addTrials);
router.get('/user/modules/:moduleId/resources/token', mainCtrl.getResourceToken);
app.get('/user/resources/:projectAccess/:projectName/:resourceType/:resourceName', mainCtrl.getResource); // NO JWT CHECK

// Repository Modules
router.get('/user/repository', repositoryCtrl.getAll);
router.get('/user/repository/:moduleId', repositoryCtrl.get);
router.get('/developer/repository/:moduleId', repositoryCtrl.get);
router.post('/developer/repository/:moduleId/invite', repositoryCtrl.invite);
router.post('/developer/repository/:moduleId/invite/remove', repositoryCtrl.removeInvite);

// Developer Modules
router.post('/developer/modules/:moduleId', developerCtrl.add);
router.get('/developer/modules', developerCtrl.getAll);
router.get('/developer/modules/:moduleId', developerCtrl.get);
router.delete('/developer/modules/:moduleId', developerCtrl.remove);
router.post('/developer/modules/:moduleId/publish/:moduleType', developerCtrl.publish);
router.get('/developer/modules/:moduleId/unpublish', developerCtrl.unpublish);
router.post('/developer/modules/:moduleId/trials/:sessionId', developerCtrl.addTrials);
router.get('/developer/modules/:moduleId/resources/token', developerCtrl.getResourceToken);
app.get('/developer/resources/:projectAccess/:projectName/:resourceType/:resourceName', developerCtrl.getResource); // NO JWT CHECK

// Admin
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users/:user', adminController.updateUser);
router.delete('/admin/users/:user', adminController.removeUser);

// User
router.get('/user/roles', authController.getRoles);
router.post('/register', userController.register);
router.get('/login', authController.isAuthenticated);

// protect api with JWT
app.use('/api', expressJwt({secret: app.get('jwt_secret')}).unless({path: ['/api/login','/api/register']}), authController.hasRole, router);


// open API
app.post('/user/verify/resend', userController.verifyResend);
app.get('/user/verify/:token', userController.verifyUser);
app.post('/user/reset', userController.resetPasswordSend);
app.get('/user/resetverify/:token', userController.verifyResetToken);
app.post('/user/reset/:token', userController.updatePassword);
app.post('/user/captcha', userController.verifyCaptcha);
app.post('/user/devaccount', userController.signupDev);

// Tatool Web Client
app.use(express.static(path.join(__dirname, 'app')));

// send 404 if no match found
app.use(function(req, res, next){
  res.status(404).send('Page not found');
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