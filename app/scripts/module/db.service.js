'use strict';

/** 
  DB Service  
  Handling saving and retrieving of data for current module/session only.
**/

angular.module('tatool.module')
  .factory('db', ['$log', 'moduleService', 'contextService', 'trialService',
    function ($log, moduleService, contextService, trialService) {
    $log.debug('DB: initialized');

    var db = {};

    // set a module property (element, key and value)
    db.setModuleProperty = function(element, propertyKey, propertyValue) {
      moduleService.setModuleProperty(element, propertyKey, propertyValue);
    };

    // get a module property by element and key
    db.getModuleProperty = function(element, propertyKey) {
      return moduleService.getModuleProperty(element, propertyKey);
    };

    // set a session property (element, key and value)
    db.setSessionProperty = function(element, propertyKey, propertyValue) {
      var currentSessionId = moduleService.getMaxSessionId();
      moduleService.setSessionProperty(element, currentSessionId, propertyKey, propertyValue);
    };

    // get a session property by element and key
    db.getSessionProperty = function(element, propertyKey) {
      var currentSessionId = moduleService.getMaxSessionId();
      return moduleService.getSessionProperty(element, currentSessionId, propertyKey);
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
      trial.executableId = (currentExecutable.name) ? currentExecutable.name : currentExecutable.customType;
      return trialService.addTrial(trial);
    };

    return db;

  }]);