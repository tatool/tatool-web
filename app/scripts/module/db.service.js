'use strict';

angular.module('tatool.module')
  .factory('db', ['$log', 'dataService', 'moduleService', 'contextService', function ($log, dataService, moduleService, contextService) {
    $log.debug('DB: initialized');

    var db = {};

    // set a module property (key and value)
    db.setModuleProperty = function(propertyKey, propertyValue) {
      dataService.setModuleProperty(propertyKey, propertyValue);
    };

    // get a module property by key
    db.getModuleProperty = function(propertyKey) {
      return dataService.getModuleProperty(propertyKey);
    };

    db.saveModule = function() {
      return dataService.saveModule();
    };

    // adds a new trial
    db.saveTrial = function(trial) {
      trial.moduleId = moduleService.getModuleId();
      trial.sessionId = moduleService.getMaxSessionId();
      trial.trialId = moduleService.getNextTrialId();
      var currentExecutable = contextService.getProperty('currentExecutable');
      trial.executableId = (currentExecutable.name) ? currentExecutable.name : currentExecutable.id;
      return dataService.addTrial(trial);
    };

    return db;

  }]);