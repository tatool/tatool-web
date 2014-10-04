'use strict';

angular.module('tatool.module')
  .factory('dataService', ['$log', '$q', '$rootScope', 'tatoolPhase', 'userService', function ($log, $q, $rootScope, tatoolPhase, userService) {
    $log.debug('DataService: initialized');

    var data = {};

    var currentModule = null;
    var currentTrials = [];

    data.initUserDB = function() {
      var prefix = Sha1.hash(userService.getUserName());
      data.modulesDB = new PouchDB(prefix + '_m');
      data.trialsDb = new PouchDB(prefix + '_t');
    };

    if (userService.getUserName()) {
      data.initUserDB();
    }

    // Modules DB services

    data.openModule = function(moduleId) {
      var q = $q.defer();

      function onSuccess(response) {
        $log.debug('Module has been opened: ' + response.moduleId);
        currentModule = new Module(moduleId);
        angular.extend(currentModule, response);
        q.resolve(currentModule);
      }

      function onError(response) {
        $log.debug('Module could not be opened: ' + response);
        q.reject('error');
      }
      
      if (!moduleId) {
        q.promise.reject('Missing Module ID.');
      } else {
        this.getModule(moduleId).then(onSuccess, onError);
      }

      return q.promise;
    };

    data.updateModule = function(module) {
      var deferred = $q.defer();

      data.modulesDB.get(module.moduleId, function(err, doc) {
        if (!err) {
          var moduleJson = JSON.parse(JSON.stringify(module));
          moduleJson._rev = doc._rev;
          data.modulesDB.put(moduleJson).then(function(result) {
            deferred.resolve(result);
          }, function(error) {
            $log.error('Error while updating module.', error);
            deferred.reject('Error while updating module.');
          });
        } else {
          $log.error('Trying to update a module which does not exist.');
          deferred.reject('Trying to update a module which does not exist.');
        }
      });

      return deferred.promise;
    };

    data.saveModule = function() {
      return this.updateModule(currentModule);
    };

    data.getModule = function(moduleId) {
      return data.modulesDB.get(moduleId);
    };

    data.deleteModule = function(module) {
      data.modulesDB.remove(module);
    };

    data.getModuleId = function() {
      if (currentModule) {
        return currentModule.moduleId;
      } else {
        return null;
      }
    };

    // set a module property (key and value)
    data.setModuleProperty = function(propertyKey, propertyValue) {
      if (currentModule) {
        currentModule.setProperty(propertyKey, propertyValue);
      }
    };

    // get a module property by key
    data.getModuleProperty = function(propertyKey) {
      if (currentModule) {
        return currentModule.getProperty(propertyKey);
      }
    };

    // get max session id
    data.getMaxSessionId = function() {
      if (currentModule) {
        return currentModule.getMaxSessionId();
      }
    };

    // set a session property (key and value)
    data.setSessionProperty = function(sessionId, propertyKey, propertyValue) {
      currentModule.getSession(sessionId).setProperty(propertyKey, propertyValue);
    };

    // get a session property by key
    data.getSessionProperty = function(sessionId, propertyKey) {
      return currentModule.getSession(sessionId).getProperty(propertyKey);
    };

    // Trials DB

    data.clearCurrentTrials = function() {
      currentTrials = [];
    };

    data.getCurrentTrials = function() {
      return currentTrials;
    };

    // add a new trial. The internal ID is [moduleId]_[sessionId]_[trialStartTime]
    data.addTrial = function(trial) {
      var trialStartTime = new Date().getTime();
      var _id = trial.moduleId + '_' + ('000000'+ trial.sessionId ).slice(-6) + '_' + trialStartTime;

      // making sure we save a new trial in order not to use the same reference
      var newTrial = {};
      angular.extend(newTrial, trial);
      currentTrials.push(newTrial);

      // broadcast event for everyone interested in a finished trial
      $rootScope.$broadcast(tatoolPhase.TRIAL_SAVE, newTrial);
      return data.trialsDb.put(JSON.parse(JSON.stringify(newTrial)), _id);
    };

    // get all trials of current module
    data.getAllTrials = function() {
      var key = this.getModuleId() + '_';
      return data.trialsDb.allDocs({startkey: key, endkey: key + '_', include_docs: true});
    };

    // get trials of a specific session of current module
    data.getTrials = function(startSession, endSession) {
      var startKey = this.getModuleId() + '_' + ('000000'+ startSession ).slice(-6) + '_';
      var endKey = (endSession) ? this.getModuleId() + '_' + endSession + '__' : null;
      return data.trialsDb.allDocs({startkey: startKey, endkey: endKey, include_docs: true});
    };

    return data;

  }]);