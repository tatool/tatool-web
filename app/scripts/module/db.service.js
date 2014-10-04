'use strict';

/** 
  DB Service  
  Handling saving and retrieving of data for current module/session only.
**/

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

    // set a session property (key and value)
    db.setSessionProperty = function(propertyKey, propertyValue) {
      var currentSessionId = moduleService.getMaxSessionId();
      dataService.setSessionProperty(currentSessionId, propertyKey, propertyValue);
    };

    // get a session property by key
    db.getSessionProperty = function(propertyKey) {
      var currentSessionId = moduleService.getMaxSessionId();
      return dataService.getSessionProperty(currentSessionId, propertyKey);
    };

    // save the module
    // This is already taken care of by Tatool at the start and end of a session therefore you should not have to call this.
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