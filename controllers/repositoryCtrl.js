var Module = require('../models/module').repositoryModule;
var mainCtrl = require('../controllers/mainCtrl');
var Q = require('q');

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
};

var insert = function(module, res) {
  var today = new Date();

  // make sure this copy of an existing module is treated as an insert by mongoose
  module.set('_id', undefined)
  module.isNew = true; 

  // set all required technical fields (overriding anything set by the user)
  module.updated_at = today;

  // remove runtime information as it's not needed in repository
  module.maxSessionId = '';
  module.moduleProperties = {};
  module.sessions = {};

  Module.create(module, function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json();
    }
  });
};

var update = function(entry, module, res) {
  var today = new Date();
  
  // update technical fields
  entry.updated_at = today;

  // update user defined information
  entry.moduleVersion = module.moduleVersion;
  entry.publishedModuleVersion = module.publishedModuleVersion;
  entry.moduleType = module.moduleType;
  entry.moduleDefinition = module.moduleDefinition;
  entry.moduleName = module.moduleName;
  entry.moduleLabel = module.moduleLabel;
  entry.moduleAuthor = module.moduleAuthor;
  entry.moduleIcon = module.moduleIcon;
  entry.moduleDescription = module.moduleDescription;
  entry.moduleMaxSessions = module.moduleMaxSessions;
  entry.exportDelimiter = module.exportDelimiter;
  entry.markModified('moduleDefinition');

  entry.save(function(err, data) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json();
    }
  });
};

exports.getAll = function(req, res) {
  Module.find({ $or: [ { moduleType: 'public' }, {$and: [{ moduleType: 'private' }, {"invites.users": { $elemMatch: { email: req.user.email } } }] } ] }
    , { moduleDefinition: 0, email: 0, created_by: 0, sessions: 0, moduleProperties: 0, invites: 0 }, function(err, entries) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(entries);
    }
  }).lean();
};

exports.get = function(req, res) {
  Module.findOne({ moduleId: req.params.moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (entry) {
        if (entry.moduleType !== 'private') { // public module: OK
          res.json(entry);
        } else {
          if (entry.created_by === req.user.email) { // owner of private module: OK
            res.json(entry);
          } else if (entry.invites) { // invited to private module: OK

            var users = entry.invites.users;
            var exists = false;
            for (var i = 0; i < users.length; i++) {
              if (req.user.email === users[i].email) {
                exists = true;
                break;
              }
            }
            if (exists) {
              res.json(entry);
            } else {
              res.status(403).json({ message: 'Module not found.'});
            }
          } else {
            res.status(403).json({ message: 'Module not found.'});
          }
        }
      } else {
        res.status(500).json({ message: 'Module not found.'});
      }
    }
  });
};

// remove module from repository
exports.remove = function(moduleId, res) {
  Module.remove({ moduleId: moduleId }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json();
    }
  });
};

exports.invite = function(req, res) {
  Module.findOne({ moduleType: 'private', moduleId: req.params.moduleId, created_by: req.user.email }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (!entry) {
        res.status(500).json({ message: 'Module not found.'});
      } else {

        var copyModule = JSON.parse(JSON.stringify(entry));
        mainCtrl.addInvite(req, copyModule).then(function(data) {
          var invites = { users: [] };
          if (entry.invites) {
            invites = entry.invites;
          }

          var status = (data === 'accepted') ? 'accepted' : 'invited';

          var user = { email: req.body.email, status: status, date: new Date() };
          invites.users.push(user);
          entry.invites = invites;
          entry.markModified('invites');

          entry.save(function(err, data) {
            if (err) {
              res.status(500).send(err);
            } else {
              res.json(entry);
            }
          });
        }, function(error) {
          res.status(500).json(error);
        });
      }
    }
  });
};

exports.removeInvite = function(req, res) {
  Module.findOne({ moduleType: 'private', moduleId: req.params.moduleId, created_by: req.user.email }, function(err, entry) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (!entry) {
        res.status(500).json({ message: 'Module not found.'});
      } else {
        
        var users = entry.invites.users;
        var removed = false;

        for (var i = 0; i < users.length; i++) {
          if (req.body.email === users[i].email) {
            entry.invites.users.splice(i, 1);
            removed = true;
            break;
          }
        }

        if (removed) {
          entry.markModified('invites');

          mainCtrl.removeInvite(req).then(function(data) {
            entry.save(function(err, data) {
              if (err) {
                res.status(500).send(err);
              } else {
                res.json(entry);
              }
            });
          }, function(error) {
            entry.save(function(err, data) {
              if (err) {
                res.status(500).send(err);
              } else {
                res.json(entry);
              }
            });
          });
        } else {
          res.status(500).json({ message: 'User not found.'});
        }
      }
    }
  });
};

exports.updateInvite = function(user, moduleId, status) {
  var deferred = Q.defer();
  var today = new Date();

  Module.findOne({ moduleType: 'private', moduleId: moduleId }, function(err, entry) {
    if (err) {
      deferred.reject(err);
    } else {
      if (!entry) {
        deferred.resolve({ message: 'Module not found.'});
      } else {
        
        var users = entry.invites.users;
        var updated = false;

        for (var i = 0; i < users.length; i++) {
          if (user === users[i].email) {
            users[i].status = status;
            users[i].date = today;
            updated = true;
            break;
          }
        }

        if (updated) {
          entry.markModified('invites');

          entry.save(function(err, data) {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve(entry);
            }
          });
        } else {
          deferred.resolve({ message: 'User not found.'});
        }
      }
    }
  });

  return deferred.promise;
};