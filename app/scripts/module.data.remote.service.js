'use strict';

angular.module('tatool')
  .factory('moduleDataRemoteService', ['$log', '$q', '$http', 'trialDataService', function ($log, $q, $http, trialDataService) {
    $log.debug('ModuleDataRemoteService: initialized');

    var data = {};

    data.closeModulesDB = function() {
      // we don't need to close a connection in remote mode
    };

    // initialize modules db
    data.openModulesDB = function(userName, callback) {
      // we don't need to to open a connection in remote mode
      if (callback !== null) {
        callback();
      }
    };

    // return all modules from DB
    data.getAllModules = function() {
      var deferred = $q.defer();

      $http.get('/api/modules')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (data) {
          deferred.reject(data);
        });
      
      return deferred.promise;
    };

    // get a module from db by its moduleId
    data.getModule = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/modules/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (data) {
          deferred.reject(data);
        });

      return deferred.promise;
    };

    // upload module file with HTML5 File API
    data.addModule = function(module) {
      var deferred = $q.defer();
      var moduleJson = JSON.parse(JSON.stringify(module));

      $http.post('/api/modules/' + module.moduleId, moduleJson)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (data) {
          deferred.reject(data);
        });

      return deferred.promise;
    };

    // delete a module and all of its trials
    data.deleteModule = function(userName, moduleId) {
      var deferred = $q.defer();

      $http.delete('/api/modules/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          trialDataService.deleteModuleTrials(userName, moduleId).then(
            function(data) {
              deferred.resolve(data);
            }, function() {
              deferred.reject('Error during removal of module trials.');
            });
        })
        .error(function (data) {
          deferred.reject(data);
        });

      return deferred.promise;
    };

    return data;

  }]);