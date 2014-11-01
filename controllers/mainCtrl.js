var Module = require('../models/module').userModule;
var Repository = require('../models/module').repositoryModule;
var exportCtrl = require('../controllers/exportCtrl');

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

  Repository.findOne({ moduleId: req.params.moduleId, moduleType: 'public' }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // update technical fields
        module.email = req.user.email;
        module.updated_at = today;

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

  Repository.findOne({ moduleId: req.params.moduleId, moduleType: 'public' }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {

        // update technical fields
        userModule.updated_at = today;

        // update user defined information
        userModule.moduleType = module.moduleType;
        userModule.moduleLabel = module.moduleLabel;
        userModule.projectUrl = module.projectUrl;
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
          exportCtrl.createTrialFile(req, module, 'user', res);
      } else {
        res.status(500).send({ message: 'Module not found.' });
      }
    }
  });
};