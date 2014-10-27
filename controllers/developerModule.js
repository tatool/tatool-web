// Load required packages
var Module = require('../models/developerModule');
var Repository = require('../controllers/repository');
var path = require("path")
var fs = require('fs');
var mkdirp = require("mkdirp");

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
      module.moduleType = req.body.moduleType;
      module.maxSessionId = req.body.maxSessionId;
      module.moduleProperties = req.body.moduleProperties;
      module.moduleDefinition = req.body.moduleDefinition;
      module.sessions = req.body.sessions;
      module.markModified('moduleDefinition');
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

exports.publishModule = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        // we got the module, now let's add it to the repository
        Repository.addRepositoryEntry(req, res);
      } else {
        res.status(500).send({ message: 'Module not found.', data: req.params.moduleId });
      }
    }
  });
};

exports.unpublishModule = function(req, res) {
  Module.findOne({ email: req.user.email, moduleId: req.params.moduleId }, function(err, module) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (module) {
        // we got the module, now let's remove it from the repository
        Repository.removeRepositoryEntry(req, res);
      } else {
        res.status(500).send({ message: 'Module not found.', data: req.params.moduleId });
      }
    }
  });
};

exports.addTrials = function(req, res) {
  var uploadPath = '';
  var filename = req.user.email + '_' + req.params.moduleId + '_' + ('000000'+ req.params.sessionId).slice(-6);
  var extension = '.csv';

  if (!req.body.target) {
    uploadPath = 'uploads/developer/' + req.params.moduleId + '/';
  } else {
    uploadPath = req.body.target;
  }

  mkdirp(uploadPath, function (err) {
    if (err) return res.status(500).json({ message: 'Error during writing file on server.' });

    fs.exists(uploadPath + filename + extension, function(exists) {
      var timestamp = '';
      if (exists) timestamp = '_' + new Date().getTime();

      fs.writeFile(uploadPath + filename + timestamp + extension, req.body.trialData, function (err) {
        if (err) return res.status(500).json({ message: 'Error during writing file on server.' });
        res.json({ message: 'Trials successfully uploaded', data: req.params.sessionId });
      });
    });
  })
};