'use strict';

angular.module('tatool.module')
  .factory('moduleService', ['$http', '$log', '$q', 'util', function ($http, $log, $q, util) {
    $log.debug('ModuleService: initialized');

    var moduleService = {};
    var module = null;
    var session = null;
    var internalSessionId = '';

    // create a new module from a module definition and return it
    moduleService.createModule = function(moduleDefinition) {
      var newModule = new Module(moduleDefinition.id);
      newModule.setModuleName(moduleDefinition.name);
      newModule.setModuleAuthor(moduleDefinition.author);
      newModule.setModuleVersion(moduleDefinition.version);
      newModule.setModuleDefinition(moduleDefinition);
      return newModule;
    };

    // sets the current module
    moduleService.setModule = function(newModule) {
      module = newModule;
    };

    moduleService.getModuleId = function() {
      return module.getId();
    };

    moduleService.getModuleName = function() {
      return module.getName();
    };

    moduleService.getModuleAuthor = function() {
      return module.getAuthor();
    };

    moduleService.getModuleVersion = function() {
      return module.getVersion();
    };

    moduleService.getModuleDefinition = function() {
      return module.getDefinition();
    };

    moduleService.getModulePackageUrl = function() {
      return module.getPackageUrl();
    };

    moduleService.getNextSessionId = function() {
      return module.getNextSessionId();
    };

    moduleService.getMaxSessionId = function() {
      return module.getMaxSessionId();
    };

    moduleService.getModuleProperties = function() {
      return module.getProperties();
    };

    moduleService.createSession = function() {
      var currentDate = new Date();
      internalSessionId = currentDate.getTime();
      var sessionId = this.getNextSessionId();
      session = new Session(sessionId, util.getDateTime());
      module.addSession(session);
      return sessionId;
    };

    moduleService.getInternalSessionId = function() {
      return internalSessionId;
    };

    moduleService.setSessionEndTime = function(endTime) {
      session.setSessionEndTime(endTime);
    };

    moduleService.setSessionComplete = function() {
      session.setSessionComplete();
    };

    moduleService.getNextTrialId = function() {
      return session.getNextTrialId();
    };

    moduleService.getMaxTrialId = function() {
      return session.getMaxTrialId();
    };

    return moduleService;
  }]);
