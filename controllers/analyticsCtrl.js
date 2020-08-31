var RepoModule = require('../models/module').repositoryModule;
var Analytics = require('../models/analytics');
var DownloadToken = require('../models/download');
var resourceCtrl = require('../controllers/resourceCtrl');
var Q = require('q');
var { v4: uuidv4 } = require('uuid');

exports.initAnalytics = function(module) {
  var deferred = Q.defer();
  var today = new Date();

  Analytics.findOne({
    moduleId: module.moduleId,
    created_by: module.created_by
  }, function(err, moduleStats) {
    if (err) {
      deferred.reject({
        message: 'Error initializing analytics entry for module.'
      });
    } else {
      if (!moduleStats) {
        var analytics = new Analytics();
        analytics.moduleId = module.moduleId;
        analytics.moduleName = module.moduleName;
        analytics.moduleLabel = module.moduleLabel;
        analytics.created_by = module.created_by;
        analytics.created_at = new Date();
        analytics.email = [module.created_by];
        analytics.userData = [];

        analytics.save(function(err, data) {
          if (err) {
            deferred.reject('Could not initialize analytics.');
          } else {
            deferred.resolve();
          }
        });
      } else {
        moduleStats.moduleName = module.moduleName;
        moduleStats.moduleLabel = module.moduleLabel;

        moduleStats.save(function(err, data) {
          if (err) {
            deferred.reject('Could not initialize analytics.');
          } else {
            deferred.resolve();
          }
        });
      }
    }
  });

  return deferred.promise;
};

exports.addAnalyticsUser = function(req, module) {
  var deferred = Q.defer();

  Analytics.findOne({
    moduleId: req.params.moduleId
  }, function(err, analyticsModule) {
    if (err) {
      deferred.reject('Could not add analytics data.');
    } else {
      if (analyticsModule) {

        var exists = false;
        for (var i = 0; i < analyticsModule.userData.length; i++) {
          if (req.user.email === analyticsModule.userData[i].email) {
            exists = true;
            break;
          }
        }

        if (!exists) {
          var newData = {};
          newData.email = req.user.email;
          newData.code = req.user.code;
          newData.extid = req.user.extid;

          newData.moduleType = module.moduleType;
          newData.maxSessionId = module.maxSessionId;
          newData.moduleProperties = module.moduleProperties;
          newData.sessions = module.sessions;
          newData.updated_at = new Date();

          analyticsModule.userData.push(newData);

          analyticsModule.save(function(err, data) {
            if (err) {
              deferred.reject('Could not add analytics data.');
            } else {
              deferred.resolve();
            }
          });

        } else {
          deferred.resolve();
        }


      } else {
        deferred.resolve();
      }
    }
  });

  return deferred.promise;
};

exports.addAnalyticsData = function(req) {
  var deferred = Q.defer();

  Analytics.findOne({
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      deferred.reject('Could not add analytics data.');
    } else {
      if (module) {

        var exists = -1;

        for (var i = 0; i < module.userData.length; i++) {
          if (req.user.email === module.userData[i].email) {
            exists = i;
            break;
          }
        }

        if (exists > -1) {
          module.userData[i].maxSessionId = req.body.maxSessionId;
          module.userData[i].moduleProperties = req.body.moduleProperties;

          // only overwrite sessions if same session start time
          for (var sessionId in req.body.sessions) {
            if (module.userData[i].sessions.hasOwnProperty(sessionId)) {
              if (req.body.sessions[sessionId].startTime == module.userData[i].sessions[sessionId].startTime) {
                module.userData[i].sessions[sessionId] = req.body.sessions[sessionId];
              }
            } else {
              module.userData[i].sessions[sessionId] = req.body.sessions[sessionId];
            }
          }

          module.userData[i].sessionToken = req.body.sessionToken;
          module.userData[i].updated_at = new Date();
          module.markModified('userData');

          module.save(function(err, data) {
            if (err) {
              deferred.reject('Could not add analytics data.');
            } else {
              deferred.resolve();
            }
          });

        } else {
          // user needs to be added
          var newData = {};
          newData.email = req.user.email;
          newData.code = req.user.code;
          newData.extid = req.user.extid;
          newData.sessionToken = req.body.sessionToken;
          newData.moduleType = req.body.moduleType;
          newData.maxSessionId = req.body.maxSessionId;
          newData.moduleProperties = req.body.moduleProperties;
          newData.sessions = req.body.sessions;
          newData.updated_at = new Date();
          module.userData.push(newData);
          module.markModified('userData');

          module.save(function(err, data) {
            if (err) {
              deferred.reject('Could not add analytics data.');
            } else {
              deferred.resolve();
            }
          });
        }


      } else {
        deferred.resolve();
      }
    }
  });

  return deferred.promise;
};

exports.getAll = function(req, res) {
  Analytics.find({
    email: {
      $in: [req.user.email]
    }
  }, {
    moduleId: 1,
    moduleName: 1
  }, function(err, modules) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(modules);
    }
  }).lean();
};

exports.get = function(req, res) {
  Analytics.findOne({
    email: {
      $in: [req.user.email]
    },
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        for (var i = 0; i < module.userData.length; i++) {
          if (module.userData[i].moduleType === 'public') {
            module.userData[i].email = '';
          }
        }
        res.json(module);
      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  }).lean();
};

exports.remove = function(req, res) {
  Analytics.remove({
    created_by: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      resourceCtrl.deleteUserData(req, res, req.params.moduleId, null);
    }
  });
};

exports.removeUser = function(req, res) {
  Analytics.findOne({
    email: {
      $in: [req.user.email]
    },
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        var exists = false;
        for (var i = 0; i < module.userData.length; i++) {
          if (req.params.userCode === module.userData[i].code.toString()) {
            exists = true;
            break;
          }
        }

        if (exists) {
          module.userData.splice(i, 1);
          module.save(function(err, data) {
            if (err) {
              res.status(500).json({
                message: 'Error saving analytics data.'
              });
            } else {
              resourceCtrl.deleteUserData(req, res, module.moduleId, req.params.userCode);
            }
          });
        } else {
          res.json();
        }

      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  });
};

exports.getUserDataDownloadToken = function(req, res) {
  Analytics.findOne({
    email: {
      $in: [req.user.email]
    },
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        const token = uuidv4();

        const fileToken = new DownloadToken();
        fileToken.token = token;
        fileToken.moduleId = req.params.moduleId;
        if (req.params.userCode) {
          fileToken.userCode = req.params.userCode;
        }
        fileToken.created_at = Date.now();
        fileToken.created_by = req.user.email;

        fileToken.save(function(err, data) {
          if (err) {
            res.status(500).json({
              message: 'Download Token not saved.'
            });
          } else {
            res.json(token);
          }
        });

      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  });
};

exports.getUserData = function(req, res) {
  DownloadToken.findOneAndRemove({
    token: req.params.token
  }, function(err, data) {
    if (err) {
      res.status(500).json({
        message: 'Download failed'
      });
    } else {
      if (data) {
        resourceCtrl.getUserData(req, res, data.moduleId, data.userCode);
      } else {
        res.status(500).json({
          message: 'Download failed'
        });
      }
    }
  });
};