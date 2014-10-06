'use strict';

angular.module('tatool.module')
  .factory('moduleService', ['$http', '$log', '$q', 'util', 'dataService', function ($http, $log, $q, util, dataService) {
    $log.debug('ModuleService: initialized');

    var moduleService = {};
    var module = null;
    var session = null;

    moduleService.openModule = function(userName, moduleId) {
      var q = $q.defer();

      if (!moduleId) {
        q.promise.reject('Missing Module ID.');
      } else {
        dataService.getModule(moduleId).then(
          function(data) {
            $log.debug('Module has been opened: ' + data.moduleId);
            module = new Module(moduleId);
            angular.extend(module, data);
            // open trials db
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

      dataService.modulesDB.get(module.moduleId,
        function(data) {
          if (data !== undefined) {
            dataService.addModule(module);
            deferred.resolve(data);
          } else {
            $log.error('Trying to update a module which does not exist.');
            deferred.reject('Trying to update a module which does not exist.');
          }
        }, function(error) {
          $log.error('Error while updating module.', error);
          deferred.reject('Error while updating module.');
        });

      return deferred.promise;
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

    // set a module property (key and value)
    moduleService.setModuleProperty = function(propertyKey, propertyValue) {
      module.setProperty(propertyKey, propertyValue);
    };

    // get a module property by key
    moduleService.getModuleProperty = function(propertyKey) {
      return module.getProperty(propertyKey);
    };

    // set a session property (key and value)
    moduleService.setSessionProperty = function(sessionId, propertyKey, propertyValue) {
      module.getSession(sessionId).setProperty(propertyKey, propertyValue);
    };

    // get a session property by key
    moduleService.getSessionProperty = function(sessionId, propertyKey) {
      return module.getSession(sessionId).getProperty(propertyKey);
    };

    moduleService.createSession = function() {
      var sessionId = this.getNextSessionId();
      session = new Session(sessionId, util.getDateTime());
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
