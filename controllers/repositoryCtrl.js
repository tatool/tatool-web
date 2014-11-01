var Module = require('../models/module').repositoryModule;

// Adding a new module from a local file
// if everything goes well will return to calling method (mainCtrl)
exports.add = function(module, res) {
  Module.findOne({ moduleId: module.moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (entry) {
        update(entry, module, res);
      } else {
        insert(module, res);
      }
    }
  });
}

var insert = function(module, res) {
  var today = new Date();

  // set all required technical fields (overriding anything set by the user)
  module.moduleVersion++;
  module.updated_at = today;

  // remove runtime information as it's not needed in repository
  module.maxSessionId = '';
  module.moduleProperties = {};
  module.sessions = {};

  Module.create(module, function(err, result) {
    if (err) {
      res.status(500).send(err);
    }
  });
};

var update = function(entry, module, res) {
  var today = new Date();
  
  // update technical fields
  entry.moduleVersion++;
  entry.updated_at = today;

  // update user defined information
  entry.moduleType = module.moduleType;
  entry.moduleDefinition = module.moduleDefinition;
  entry.moduleName = module.moduleName;
  entry.moduleAuthor = module.moduleAuthor;
  entry.moduleIcon = module.moduleIcon;
  entry.markModified('moduleDefinition');

  entry.save(function(err, data) {
    if (err) {
      res.status(500).send(err);
    }
  });
};

exports.getAll = function(req, res) {
  Module.find({ moduleType: 'public' }, function(err, entries) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(entries);
    }
  });
};

exports.get = function(req, res) {
  Module.findOne({ moduleType: 'public', moduleId: req.params.moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(entry);
    }
  });
};

// remove module from repository
exports.remove = function(moduleId, res) {
  Module.remove({ moduleId: moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    }
  });
};