'use strict';

angular.module('tatool.module')
  .factory('moduleService', ['$http', '$log', '$q', 'util', 'moduleDataService', function ($http, $log, $q, util, moduleDataService) {
    $log.debug('ModuleService: initialized');

    var moduleService = {};
    var module = null;
    var session = null;

    moduleService.openModule = function(userName, moduleId) {
      var q = $q.defer();

      if (!moduleId) {
        q.promise.reject('Missing Module ID.');
      } else {
        moduleDataService.getModule(moduleId).then(
          function(data) {
            $log.debug('Module has been opened: ' + data.moduleId);
            module = new Module(moduleId);
            angular.extend(module, data);
            q.resolve(module);
          }, function(error) {
            $log.debug('Module could not be opened: ' + error);
            q.reject(error);
          });
      }

      return q.promise;
    };

    moduleService.saveModule = function() {
      var deferred = $q.defer();

      moduleDataService.addModule(module).then(function(data) {
        deferred.resolve(data);
      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    };

    moduleService.getModuleId = function() {
      return module.getId();
    };

    moduleService.getModuleLabel = function() {
      return module.getLabel();
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

    moduleService.getModulePackagePath = function() {
      return module.getPackagePath();
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

    // set a module property (key and value)
    moduleService.setModuleProperty = function(element, propertyKey, propertyValue) {
      var name = (element.name !== undefined) ? element.name : 'undefined';
      module.setProperty(name, propertyKey, propertyValue);
    };

    // get a module property by key
    moduleService.getModuleProperty = function(element, propertyKey) {
      var name = (element.name !== undefined) ? element.name : 'undefined';
      return module.getProperty(name, propertyKey);
    };

    // set a session property (key and value)
    moduleService.setSessionProperty = function(element, sessionId, propertyKey, propertyValue) {
      var name = (element.name !== undefined) ? element.name : 'undefined';
      module.getSession(sessionId).setProperty(name, propertyKey, propertyValue);
    };

    // get a session property by key
    moduleService.getSessionProperty = function(element, sessionId, propertyKey) {
      var name = (element.name !== undefined) ? element.name : 'undefined';
      return module.getSession(sessionId).getProperty(name, propertyKey);
    };

    moduleService.createSession = function() {
      var sessionId = this.getNextSessionId();
      session = new Session(sessionId, util.getCurrentDate());
      module.addSession(session);
      return sessionId;
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
