'use strict';
/* global IDBStore */

angular.module('tatool')
  .factory('moduleDataLocalService', ['$log', '$q', 'trialDataService', function ($log, $q, trialDataService) {
    $log.debug('ModuleDataLocalService: initialized');

    var data = {};

    var modulesDBready = false;

    data.closeModulesDB = function() {
      modulesDBready = false;
    };

    // initialize modules db
    data.openModulesDB = function(userName, callback) {
      if (modulesDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        var prefix = Sha1.hash(userName);

        data.modulesDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: prefix + '_m',
          keyPath: 'moduleId',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Modules store ready!');
            modulesDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };

    // return all modules from DB
    data.getAllModules = function() {
      var deferred = $q.defer();

      function onSuccess(data) {
        deferred.resolve(data);
      }

      function onError(error) {
        deferred.reject(error);
      }

      data.modulesDB.getAll(onSuccess, onError);

      return deferred.promise;
    };

    // get a module from db by its moduleId
    data.getModule = function(moduleId) {
      var deferred = $q.defer();

      data.modulesDB.get(moduleId, function (data) {
          if (data === undefined) {
            data = null;
          }
          deferred.resolve(data);
        }, function (error) {
          deferred.reject('Module retrieval failed: ' + error);
        });
      return deferred.promise;
    };

    // upload module file with HTML5 File API
    data.addModule = function(module) {
      var deferred = $q.defer();

      var moduleJson = JSON.parse(JSON.stringify(module));

      data.modulesDB.put(moduleJson,
        function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject('Module creation failed: ' + error);
        });

      return deferred.promise;
    };

    // delete a module and all of its trials
    data.deleteModule = function(userName, moduleId) {
      var deferred = $q.defer();

      data.modulesDB.remove(moduleId,
        function() {
          trialDataService.deleteModuleTrials(userName, moduleId).then(
            function(data) {
              deferred.resolve(data);
            }, function() {
              deferred.reject('Error during removal of module trials.');
            });
        }, function() {
          deferred.reject('Error during removal of module.');
        });

      return deferred.promise;
    };

    return data;

  }]);