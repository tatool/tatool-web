var Module = require('../models/module').developerModule;
var constants = require('../models/module').constants;
var repositoryCtrl = require('../controllers/repositoryCtrl');
var analyticsCtrl = require('../controllers/analyticsCtrl');
var resourceCtrl = require('../controllers/resourceCtrl');


// Adding a new module from a local file
exports.add = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.body.moduleId
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

var insert = function(req, res) {
  var today = new Date();

  // get the module content
  var module = req.body;

  // set all required technical fields (overriding anything set by the user)
  module.email = req.user.email;
  module.moduleVersion = 1;
  module.publishedModuleVersion = 0;
  module.created_by = req.user.email;
  module.created_at = today;
  module.updated_at = today;
  module.moduleStatus = constants.MODULE_STATUS_READY;
  module.moduleType = '';

  Module.create(module, function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

var update = function(req, res, module) {
  var today = new Date();

  // update technical fields
  module.updated_at = today;
  module.sessionToken = undefined; // unset session token to protect access to resources

  Module.find({
    email: req.user.email,
    moduleType: {
      $exists: true,
      $nin: ['']
    }
  }, function(err, result) {
    if (err) {
      res.status(500).send({
        message: 'Unknown error occurred during saving of module.'
      });
    } else if (result.length >= req.app.get('module_limit') && !module.moduleType && req.body.moduleType !== '' && !req.app.get('editor_user').includes(req.user.email)) {
      res.status(500).send({
        message: 'The number of simultaneously published modules per researcher is currently restricted to ' + req.app.get('module_limit') + '.'
      });
    } else {
      // update technical information
      module.moduleVersion = req.body.moduleVersion;

      // update user defined information
      module.moduleType = req.body.moduleType;
      module.moduleLabel = req.body.moduleLabel;
      module.moduleDefinition = req.body.moduleDefinition;
      module.moduleName = req.body.moduleName;
      module.moduleAuthor = req.body.moduleAuthor;
      module.moduleIcon = req.body.moduleIcon;
      module.moduleDescription = req.body.moduleDescription;
      module.moduleMaxSessions = req.body.moduleMaxSessions;
      module.moduleBackground = req.body.moduleBackground;
      module.moduleForwardUrl = req.body.moduleForwardUrl;
      module.exportDelimiter = req.body.exportDelimiter;
      module.exportFormat = req.body.exportFormat;
      module.markModified('moduleDefinition');

      // update runtime information
      module.maxSessionId = req.body.maxSessionId;
      module.moduleProperties = req.body.moduleProperties;
      module.sessions = req.body.sessions;
      module.markModified('moduleProperties');
      module.markModified('sessions');

      if (req.body.moduleType !== '') {
        analyticsCtrl.initAnalytics(module).then(function() {
          module.save(function(err, data) {
            if (err) {
              res.status(500).send(err);
            } else {
              res.json(module);
            }
          });
        }, function(error) {
          res.status(500).json(error);
        });
      } else {
        module.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json(module);
          }
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
  });
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
  Module.deleteMany({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({
        message: 'Module removed.'
      });
    }
  });
};

exports.publish = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        module.publishedModuleVersion = module.moduleVersion;
        module.moduleType = req.params.moduleType;
        if (module.moduleType !== 'private') {
          module.invites = undefined;
        }

        module.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            // we got the module, now let's add it to the repository
            repositoryCtrl.add(module, res);
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

exports.unpublish = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        module.moduleType = '';
        module.invites = undefined;
        module.publishedModuleVersion = 0;
        module.save(function(err, data) {
          if (err) {
            res.status(500).send(err);
          } else {
            // we got the module, now let's remove it from the repository
            repositoryCtrl.remove(module.moduleId, res);
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

exports.addTrials = function(req, res) {
  Module.findOne({
    email: req.user.email,
    moduleId: req.params.moduleId
  }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        resourceCtrl.setUserData(req, module, 'developer', res);
      } else {
        res.status(500).json({
          message: 'Module not found.'
        });
      }
    }
  });
};