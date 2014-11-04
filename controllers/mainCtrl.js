var Module = require('../models/module').userModule;
var Repository = require('../models/module').repositoryModule;
var exportCtrl = require('../controllers/exportCtrl');
var repositoryCtrl = require('../controllers/repositoryCtrl');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
var Q = require('q');

// Adding/Updating a new module from the repository
exports.install = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
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

  Repository.findOne({ moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // update technical fields
        module._id = undefined;
        module.email = req.user.email;
        module.updated_at = today;
        module.invites = undefined;
        module.moduleStatus = 'ready';

        Module.create(module, function(err, result) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json(module);
          }
        });

      } else {
        res.status(500).json({ message: 'Module not found.'});
      }
    }
  });
};

// update existing module with latest version from repository
var update = function(req, res, userModule) {
  var today = new Date();

  Repository.findOne({ moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // update technical fields
        userModule.updated_at = today;
        userModule.moduleStatus = 'ready';
        userModule.invites = undefined;

        // update user defined information
        userModule.moduleType = module.moduleType;
        userModule.moduleLabel = module.moduleLabel;
        userModule.project = module.project;
        userModule.moduleDefinition = module.moduleDefinition;
        userModule.moduleName = module.moduleName;
        userModule.moduleAuthor = module.moduleAuthor;
        userModule.moduleIcon = module.moduleIcon;
        userModule.markModified('moduleDefinition');

        userModule.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json(userModule);
          }
        });

      } else {
        res.status(500).json({ message: 'Module not found.'});
      }
    }
  });
};

// Adding a new invite module to user db - triggered from repository
exports.addInvite = function(req, repositoryModule) {
  var deferred = Q.defer();
  var today = new Date();

  Module.findOne({ email: req.body.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      deferred.reject({ message: 'Error adding invite.'});
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
            deferred.reject({ message: 'Error adding invite.'});
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
  Module.findOne({ moduleType: 'private', moduleId: req.params.moduleId, email: req.user.email }, function(err, module) {
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
        res.status(500).json({ message: 'Invite not found.'});
      }
    }
  });
};

// removing invite from user db - triggered from repository
exports.removeInvite = function(req) {
  var deferred = Q.defer();
  var today = new Date();

  Module.findOne({ email: req.body.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      deferred.reject({ message: 'Error removing invite.'});
    } else {
      if (module && module.moduleStatus === 'invite') {
        Module.remove({ email: req.body.email, moduleId: req.params.moduleId }, function(err, module) {
          if (err) {
            deferred.reject({ message: 'Error removing invite.'});
          } else {
            deferred.resolve('success');
          }
        });
      } else {
        deferred.resolve({ message: 'No module in status invite found'});
      }
    }
  });

  return deferred.promise;
};

// save runtime information to module
exports.save = function(req, res) {
  var today = new Date();
  
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        // update technical fields
        module.updated_at = today;
        module.sessionToken = undefined;  // unset session token to invalidate resources

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
            res.json(module);
          }
        });

      } else {
        res.status(500).json({ message: 'Module not found.'});
      }
    }
  });
};

exports.getAll = function(req, res) {
  Module.find({ email: req.user.email }, function(err, modules) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(modules);
    }
  });
};

exports.get = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

exports.remove = function(req, res) {
  Module.remove({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

exports.addTrials = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
          exportCtrl.createFile(req, module, 'user', res);
      } else {
        res.status(500).json({ message: 'Module not found.' });
      }
    }
  });
};

exports.getResourceToken = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {

      crypto.randomBytes(Math.ceil(8 * 3 / 4), function(ex, buf) {
        var random = buf.toString('base64')
        .slice(0, 8)
        .replace(/\+/g, '0')
        .replace(/\//g, '0');
        random += new Date().getTime();

        module.sessionToken = random;

        module.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json({ token: random });
          }
        });
      });
    }
  }); 
};

exports.getResource = function(req, res) {
  var projectsPath = req.app.get('projects_path');
  Module.findOne({ sessionToken: req.query.token }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else if (module) {
      if (projectsPath.substring(0, 4) !== 'http') {
        var file = projectsPath + req.params.projectAccess + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName;
        fs.exists(file, function(exists) {
          if (exists) {
            res.download(file);
          } else {
            res.status(404).json({ message: 'Resource not found.'} );
          }
        });
      } else {
        request(projectsPath + req.params.projectAccess + '/' + req.params.projectName + '/' + req.params.resourceType + '/' + req.params.resourceName)
          .auth(req.app.get('resource_user'), req.app.get('resource_pw'), true)
            .pipe(res);
      }

    } else {
      res.status(404).json({ message: 'Resource not found.'} );
    }
  }); 
};