'use strict';

/** 
  DB Service  
  Handling saving and retrieving of data for current module/session only.
**/

angular.module('tatool.module')
  .factory('db', ['$log', 'dataService', 'moduleService', 'contextService', 'trialService', 'executor',
    function ($log, dataService, moduleService, contextService, trialService, executor) {
    $log.debug('DB: initialized');

    var db = {};

    // set a module property (key and value)
    db.setModuleProperty = function(propertyKey, propertyValue) {
      moduleService.setModuleProperty(propertyKey, propertyValue);
    };

    // get a module property by key
    db.getModuleProperty = function(propertyKey) {
      return moduleService.getModuleProperty(propertyKey);
    };

    // set a session property (key and value)
    db.setSessionProperty = function(propertyKey, propertyValue) {
      var currentSessionId = moduleService.getMaxSessionId();
      moduleService.setSessionProperty(currentSessionId, propertyKey, propertyValue);
    };

    // get a session property by key
    db.getSessionProperty = function(propertyKey) {
      var currentSessionId = moduleService.getMaxSessionId();
      return moduleService.getSessionProperty(currentSessionId, propertyKey);
    };

    // save the module
    // This is already taken care of by Tatool at the start and end of a session.
    // Only call this method if you require the module to be stored during a session.
    db.saveModule = function() {
      return moduleService.saveModule();
    };

    // add new trial after extending it with base properties
    db.saveTrial = function(trial) {
      trial.moduleId = moduleService.getModuleId();
      trial.sessionId = moduleService.getMaxSessionId();
      trial.trialId = moduleService.getNextTrialId();
      var currentExecutable = contextService.getProperty('currentExecutable');
      trial.executableId = (currentExecutable.name) ? currentExecutable.name : currentExecutable.id;
      return trialService.addTrial(trial);
    };

    return db;

  }]);