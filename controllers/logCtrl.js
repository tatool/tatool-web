var Log = require('../models/log').moduleLog;
var Q = require('q');

// Add user log entry
exports.addLogEntry = function(req) {
  var deferred = Q.defer();
  Log.findOne({ email: req.user.email }, function(err, userLog) {
    if (err) {
      deferred.reject('Could not add log data.');
    } else {
      if (userLog) {

        if (!(req.params.moduleId in userLog.modules)) {
          userLog.modules[req.params.moduleId] = {
            maxSessionId: 0
          };
        }

        userLog.markModified('modules');

        userLog.save(function(err, data) {
          if (err) {
            deferred.reject('Could not add log data.');
          } else {
            deferred.resolve();
          }
        });

      } else {
        // insert new log user entry 
        var newLogEntry = {};
        newLogEntry.email = req.user.email;
        newLogEntry.modules = {};
        newLogEntry.modules[req.params.moduleId] = {
          maxSessionId: 0
        };

        Log.create(newLogEntry, function(err, result) {
          if (err) {
            deferred.reject('Could not add log data.');
          } else {
            deferred.resolve();
          }
        });
      }
    }
  });

  return deferred.promise;
};


// Update user log entry
exports.updateModuleLogEntry = function(req) {
  var deferred = Q.defer();
  Log.findOne({ email: req.user.email }, function(err, userLog) {
    if (err) {
      deferred.reject('Could not find user log data.');
    } else {
      if (userLog) {

        if (!(req.params.moduleId in userLog.modules)) {
          userLog.modules[req.params.moduleId] = {
            maxSessionId: req.body.maxSessionId
          };
        } else {
          userLog.modules[req.params.moduleId].maxSessionId = req.body.maxSessionId;
        }

        userLog.markModified('modules');

        userLog.save(function(err, data) {
          if (err) {
            deferred.reject('Could not add log data.');
          } else {
            deferred.resolve();
          }
        });

      } else {
        // for backward compatibility we don't crash here but set up log entry
        var newLogEntry = {};
        newLogEntry.email = req.user.email;
        newLogEntry.modules = {};
        newLogEntry.modules[req.params.moduleId] = {
          maxSessionId: req.body.maxSessionId
        };

        Log.create(newLogEntry, function(err, result) {
          if (err) {
            deferred.reject('Could not add log data.');
          } else {
            deferred.resolve();
          }
        });
      }
    }
  });

  return deferred.promise;
};


// get log entry maxSessionId
exports.getLogMaxSessionId = function(req) {
  var deferred = Q.defer();
  Log.findOne({ email: req.user.email }, function(err, userLog) {
    if (err) {
      deferred.reject('Could not add log data.');
    } else {
      if (userLog) {

        var maxSessionId = 0;
        if (req.params.moduleId in userLog.modules) {
          maxSessionId = userLog.modules[req.params.moduleId].maxSessionId;
        }

        deferred.resolve(maxSessionId);
      } else {
        deferred.resolve(0);
      }
    }
  });

  return deferred.promise;
};