// server
var express = require('express');
var compress = require('compression');
var os = require('os');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose'); 
mongoose.Promise = global.Promise;
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var favicon = require('serve-favicon');
var projects = require('./projects');

// server setup
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || process.argv[3] || 'prod');
app.set('jwt_secret', process.env.JWT_SECRET || 'secret');

app.set('projects_path', process.env.PROJECTS_PATH || __dirname + '/app/projects/');
app.set('resource_user', process.env.RESOURCE_USER || 'tatool');
app.set('resource_pw', process.env.RESOURCE_PW || 'secret');
app.set('captcha_private_key', process.env.RECAPTCHA_PRIVATE_KEY || '');
app.set('remote_url', process.env.REMOTE_URL);
app.set('remote_upload', process.env.REMOTE_UPLOAD);
app.set('remote_download', process.env.REMOTE_DOWNLOAD);
app.set('remote_delete', process.env.REMOTE_DELETE);
app.set('editor_user', process.env.EDITOR_USER || '');
app.set('override_upload_dir', false);
app.set('module_limit', 3);

// dependencies
var userController = require('./controllers/user');
var mainCtrl = require('./controllers/mainCtrl');
var repositoryCtrl = require('./controllers/repositoryCtrl');
var developerCtrl = require('./controllers/developerCtrl');
var analyticsCtrl = require('./controllers/analyticsCtrl');
var authController = require('./controllers/auth')
var adminController = require('./controllers/admin');
var commonCtrl = require('./controllers/commonCtrl');
var logCtrl = require('./controllers/logCtrl');

// db
mongoose.connect( process.env.MONGOLAB_URI || 'mongodb://127.0.0.1/tatool-web', {  } );

//logging setup
if (app.get('env') === 'dev') {
  app.use(logger('dev'));
  mongoose.set('debug', true);
}

//compression
app.use(compress());
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
router.get('/user/projects', commonCtrl.getProjects);
app.get('/user/resources/:projectAccess/:projectName/:resourceType/:resourceName', mainCtrl.getResource); // NO JWT CHECK

// Public Modules
router.post('/public/modules/:moduleId/install', mainCtrl.install);
router.post('/public/modules/:moduleId', mainCtrl.save);
router.get('/public/modules/:moduleId', mainCtrl.get);
router.post('/public/modules/:moduleId/trials/:sessionId', mainCtrl.addTrials);
router.get('/public/modules/:moduleId/resources/token', mainCtrl.getResourceToken);
app.get('/public/resources/:projectAccess/:projectName/:resourceType/:resourceName', mainCtrl.getResource); // NO JWT CHECK

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
router.get('/developer/projects', commonCtrl.getProjects);
app.get('/developer/resources/:projectAccess/:projectName/:resourceType/:resourceName', developerCtrl.getResource); // NO JWT CHECK

// Analytics Modules
router.get('/analytics/modules', analyticsCtrl.getAll);
router.get('/analytics/modules/:moduleId', analyticsCtrl.get);
router.delete('/analytics/modules/:moduleId', analyticsCtrl.remove);
router.delete('/analytics/modules/:moduleId/:userCode', analyticsCtrl.removeUser);
router.get('/analytics/data/modules/:moduleId', analyticsCtrl.getAllUserDataDownloadToken);
router.get('/analytics/data/modules/:moduleId/:userCode', analyticsCtrl.getUserDataDownloadToken);

// Admin
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users/:user', adminController.updateUser);
router.post('/admin/users/:user/reset', adminController.updatePassword);
router.delete('/admin/users/:user', adminController.removeUser);

router.get('/admin/projects', adminController.getAllProjects);
router.post('/admin/projects/:access/:project', adminController.addProject);
router.delete('/admin/projects/:access/:project', adminController.deleteProject);

// User
router.get('/user/roles', authController.getRoles);
router.post('/register', userController.register);
router.get('/login', authController.isAuthenticated);

// protect api with JWT
app.use('/api', expressJwt({secret: app.get('jwt_secret')}).unless({path: ['/api/login','/api/register']}), noCache, authController.hasRole, router);

// disable caching for API
function noCache(req, res, next){
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  next();
}

// open API
app.get('/mode', function(req, res) {
  res.json({mode: req.app.get('mode')});
});
app.post('/user/verify/resend', userController.verifyResend);
app.get('/user/verify/:token', userController.verifyUser);
app.post('/user/reset', userController.resetPasswordSend);
app.get('/user/resetverify/:token', userController.verifyResetToken);
app.post('/user/reset/:token', userController.updatePassword);
app.post('/user/captcha', userController.verifyCaptcha);
app.post('/user/devaccount', userController.signupDev);
app.get('/data/user/all/:token', analyticsCtrl.getAllUserData);
app.get('/data/user/:token', analyticsCtrl.getUserData);

// open API for public module
app.get('/public/:moduleId', mainCtrl.getPublic);
app.get('/public/login/:moduleId', mainCtrl.installPublic);

// Tatool Web Client
app.use(express.static(path.join(__dirname, 'dist')));

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


//** -------------- **//
//** STARTUP SCRIPT **//
//** -------------- **//

// initialize userCode counter at startup
userController.initCounter(setup);

function setup() {
  // processing run mode 'lab'
  if (process.argv[2] === 'lab') {
    console.log('Running tatool in LAB mode.')
    app.set('mode', 'lab');
    userController.registerAdmin();
  }

  // setup default project structure
  adminController.initProjects(projects);
}

// start server
app.listen(app.get('port'), function() {
  console.log('You can now access tatool on ' + os.hostname() + ':' + app.get('port'));
});