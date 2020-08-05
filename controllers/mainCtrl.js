var Module = require('../models/module').userModule;
var Repository = require('../models/module').repositoryModule;
var exportCtrl = require('../controllers/exportCtrl');
var repositoryCtrl = require('../controllers/repositoryCtrl');
var analyticsCtrl = require('../controllers/analyticsCtrl');
var userCtrl = require('../controllers/user');
var logCtrl = require('../controllers/logCtrl');
var resourceCtrl = require('../controllers/resourceCtrl');

var Q = require('q');
const {
  Storage
} = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('tatool-web-stage.appspot.com');

// Adding/Updating a new module from the repository
exports.install = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        update(req, res, module);
      } else {
        insert(req, res);
      }
    }
  });
};

// insert new module to user database
var insert = function(req, res) {
  var today = new Date();

  Repository.findOne({
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // make sure this copy of an existing module is treated as an insert by mongoose
        module.set('_id', undefined)
        module.isNew = true;

        // update technical fields
        module.email = req.user.email;
        module.updated_at = today;
        module.invites = undefined;
        module.moduleStatus = 'ready';
        module.created_by = module.created_by;

        // get log entry
        logCtrl.getLogMaxSessionId(req).then(function(maxSessionId) {

          if (module.moduleMaxSessions) {
            module.maxSessionId = maxSessionId;
          }

          // add module
          Module.create(module, function(err, result) {
            if (err) {
              res.status(500).send(err);
            } else {

              // add analytics user
              analyticsCtrl.addAnalyticsUser(req, module).then(function(data) {
                // add log entry
                logCtrl.addLogEntry(req).then(function() {
                  res.json(module);
                }, function(error) {
                  res.status(500).json({
                    message: 'Error adding logs data.'
                  });
                });

              }, function(error) {
                res.status(500).json({
                  message: 'Error adding analytics data.'
                });
              });

            }
          });

        }, function(error) {
          res.status(500).json({
            message: 'Error accessing logs data.'
          });
        });

      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  });
};

// update existing module with latest version from repository
var update = function(req, res, userModule) {
  var today = new Date();

  Repository.findOne({
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // update technical fields
        userModule.updated_at = today;
        userModule.moduleStatus = 'ready';
        userModule.invites = undefined;
        userModule.moduleVersion = module.moduleVersion;
        userModule.publishedModuleVersion = module.publishedModuleVersion;

        // update user defined information
        userModule.moduleType = module.moduleType;
        userModule.moduleLabel = module.moduleLabel;
        userModule.moduleDefinition = module.moduleDefinition;
        userModule.moduleName = module.moduleName;
        userModule.moduleAuthor = module.moduleAuthor;
        userModule.moduleIcon = module.moduleIcon;
        userModule.moduleDescription = module.moduleDescription;
        userModule.moduleMaxSessions = module.moduleMaxSessions;
        userModule.exportDelimiter = module.exportDelimiter;
        userModule.markModified('moduleDefinition');

        userModule.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            analyticsCtrl.addAnalyticsUser(req, module).then(function(data) {
              res.json(userModule);
            }, function(error) {
              res.status(500).json({
                message: 'Error adding analytics data.'
              });
            });
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

// Get a public URL module
exports.getPublic = function(req, res) {
  Repository.findOne({
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        res.json(module);
      } else {
        res.status(404).json({
          message: 'No module found'
        });
      }
    }
  });
};

// Adding a new module from an URL
exports.installPublic = function(req, res) {
  Repository.findOne({
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        userCtrl.getTempUser(req, res).then(function(user) {
          var token = user.createToken(req.app.get('jwt_secret'));
          res.json({
            token: token,
            roles: user.roles,
            code: user.code
          });
        }, function(error) {
          res.status(500).json(error);
        });
      } else {
        res.status(404).json({
          message: 'No module found'
        });
      }
    }
  });
};

// Adding a new invite module to user db - triggered from repository
exports.addInvite = function(req, repositoryModule) {
  var deferred = Q.defer();
  var today = new Date();

  Module.findOne({
    email: req.body.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      deferred.reject({
        message: 'Error adding invite.'
      });
    } else {
      if (module) {
        deferred.resolve('accepted');
      } else {
        // update technical fields
        repositoryModule._id = undefined;
        repositoryModule.email = req.body.email;
        repositoryModule.moduleStatus = 'invite';
        repositoryModule.updated_at = today;
        repositoryModule.invites = undefined;

        Module.create(repositoryModule, function(err, result) {
          if (err) {
            deferred.reject({
              message: 'Error adding invite.'
            });
          } else {
            deferred.resolve('invited');
          }
        });
      }
    }
  });

  return deferred.promise;
};

// user accepting or declining invite
exports.processInvite = function(req, res) {
  Module.findOne({
    moduleType: 'private',
    moduleId: req.params.moduleId,
    email: req.user.email
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (req.params.response === 'accepted' || req.params.response === 'declined') {
        repositoryCtrl.updateInvite(req.user.email, req.params.moduleId, req.params.response).then(function(data) {
          if (req.params.response === 'accepted') {
            exports.install(req, res);
          } else {
            exports.remove(req, res);
          }
        }, function(error) {
          res.status(500).json(error);
        });
      } else {
        res.status(500).json({
          message: 'Invite not found.'
        });
      }
    }
  });
};

// removing invite from user db - triggered from repository
exports.removeInvite = function(req) {
  var deferred = Q.defer();
  var today = new Date();

  Module.findOne({
    email: req.body.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      deferred.reject({
        message: 'Error removing invite.'
      });
    } else {
      if (module && module.moduleStatus === 'invite') {
        Module.remove({
          email: req.body.email,
          moduleId: req.params.moduleId
        }, function(err, module) {
          if (err) {
            deferred.reject({
              message: 'Error removing invite.'
            });
          } else {
            deferred.resolve('success');
          }
        });
      } else {
        deferred.resolve({
          message: 'No module in status invite found'
        });
      }
    }
  });

  return deferred.promise;
};

// save runtime information to module
exports.save = function(req, res) {
  var today = new Date();

  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // remember sessiontoken to enrich analytics
        if (module.sessionToken) {
          module.lastSessionToken = module.sessionToken;
        }
        req.body.sessionToken = module.lastSessionToken;

        // update technical fields
        module.updated_at = today;
        module.sessionToken = undefined; // unset session token to invalidate resources

        // update runtime information
        module.maxSessionId = req.body.maxSessionId;
        module.moduleProperties = req.body.moduleProperties;
        module.sessions = req.body.sessions;
        module.markModified('moduleProperties');
        module.markModified('sessions');

        module.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            analyticsCtrl.addAnalyticsData(req).then(function(data) {
              logCtrl.updateModuleLogEntry(req).then(function() {
                res.json(module);
              }, function(error) {
                res.status(500).json({
                  message: 'Error adding logs data.'
                });
              });
            }, function(error) {
              res.status(500).json({
                message: 'Error adding analytics data.'
              });
            });
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

exports.getAll = function(req, res) {
  Module.find({
    email: req.user.email
  }, function(err, modules) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(modules);
    }
  }).lean();
};

exports.get = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

exports.remove = function(req, res) {
  Module.remove({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

exports.addTrials = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        exportCtrl.createFile(req, module, 'user', res);
      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  });
};