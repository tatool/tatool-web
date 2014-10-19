// Load required packages
var Module = require('../models/module');

exports.addModule = function(req, res) {

  var today = new Date();

  Module.findOne({ email: req.user.email, moduleId: req.body.moduleId }, function(err, module) {
    if (err) res.status(500).send(err);

    // add new module
    if (!module) {
      // Create a new module
      module = req.body;
      module.email = req.user.email;
      module.created_at = today;
      module.updated_at = today;

      Module.create(module, function(err, result) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({ message: 'Module successfully added!', data: module });
        }
      });
      
      // update existing module
    } else {
      module.updated_at = today;
      module.maxSessionId = req.body.maxSessionId;
      module.moduleProperties = req.body.moduleProperties;
      module.sessions = req.body.sessions;
      module.markModified('moduleProperties');
      module.markModified('sessions');

      module.save(function(err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({ message: 'Module successfully updated!', data: module });
        }
      });
    }
  });
  
};

exports.getModules = function(req, res) {
  Module.find({ email: req.user.email }, function(err, modules) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(modules);
    }
  });
};

exports.getModule = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};

exports.removeModule = function(req, res) {
  Module.remove({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(module);
    }
  });
};