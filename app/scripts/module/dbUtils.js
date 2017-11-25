'use strict';

/** 
  dbUtils Service  
  Handling saving and retrieving of data for current module/session only.
**/

DbUtils.$inject = ['$log', 'moduleService', 'contextService', 'trialService', 'handlerService'];

function DbUtils($log, moduleService, contextService, trialService, handlerService) {
    $log.debug('DB: initialized');

    var utils = {};

    // get a handler element
    utils.getHandler = function(handlerName) {
      return handlerService.getHandler(handlerName);
    };

    // set a module property (element, key and value)
    utils.setModuleProperty = function(element, propertyKey, propertyValue) {
      moduleService.setModuleProperty(element, propertyKey, propertyValue);
    };

    // get a module property by element and key
    utils.getModuleProperty = function(element, propertyKey) {
      return moduleService.getModuleProperty(element, propertyKey);
    };

    // set a session property (element, key and value)
    utils.setSessionProperty = function(element, propertyKey, propertyValue) {
      var currentSessionId = moduleService.getMaxSessionId();
      moduleService.setSessionProperty(element, currentSessionId, propertyKey, propertyValue);
    };

    // get a session property by element and key
    utils.getSessionProperty = function(element, propertyKey) {
      var currentSessionId = moduleService.getMaxSessionId();
      return moduleService.getSessionProperty(element, currentSessionId, propertyKey);
    };

    // get session number
    utils.getSessionNr = function() {
      return moduleService.getMaxSessionId();
    };

    // get trial number
    utils.getTrialNr = function() {
      return moduleService.getMaxTrialId();
    };

    // set session condition
    utils.setSessionCondition = function(condition) {
      return moduleService.setSessionCondition(condition);
    };

    // get session condition
    utils.getSessionCondition = function() {
      return moduleService.getSessionCondition();
    };
    
    // add new trial after extending it with base properties
    utils.saveTrial = function(trial, showStatusFeedback) {
      trial.moduleId = moduleService.getModuleId();
      trial.sessionId = moduleService.getMaxSessionId();
      trial.sessionToken = moduleService.getSessionToken();
      trial.trialId = moduleService.getNextTrialId();
      var currentExecutable = contextService.getProperty('currentExecutable');
      trial.executableId = (currentExecutable.name) ? currentExecutable.name : currentExecutable.customType;
      return trialService.addTrial(trial, showStatusFeedback);
    };

    return utils;

}

export default DbUtils;