'use strict';
/* global IDBStore */

angular.module('tatool')
  .factory('trialDataService', ['$log', '$q', function ($log, $q) {
    $log.debug('TrialDataService: initialized');

    var data = {};

    var trialsDBready = false;

    data.closeTrialsDB = function() {
      trialsDBready = false;
    };

    // initialize trials db
    data.openTrialsDB = function(userName, callback) {
      if (trialsDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        var prefix = Sha1.hash(userName);

        data.trialsDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: prefix + '_t',
          keyPath: '_id',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Trials store ready!');
            trialsDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };
    
    // delete all trials of given module
    data.deleteModuleTrials = function(userName, moduleId) {
      var deferred = $q.defer();

      function deleteTrials() {
        var keyRange = data.trialsDB.makeKeyRange({
          lower: moduleId + '_',
          excludeLower: false,
          upper: moduleId + '__',
          excludeUpper: false
        });

        data.trialsDB.remove(keyRange,
          function(data) {
            deferred.resolve(data);
          }, function(error) {
            deferred.reject(error);
          });
      }

      data.openTrialsDB(userName, deleteTrials);

      return deferred.promise;
    };

    // add a new trial. The internal ID is [moduleId]_[sessionId]_[trialTime]
    data.addTrial = function(trial) {
      var deferred = $q.defer();
      
      data.trialsDB.put(JSON.parse(JSON.stringify(trial)),
        function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // get all trials of current module
    data.getAllTrials = function(userName, moduleId) {
      var deferred = $q.defer();

      function queryTrials() {
        var options = {};
        var moduleKeyRange = data.trialsDB.makeKeyRange({
          lower: moduleId + '_',
          excludeLower: false,
          upper: moduleId + '__',
          excludeUpper: false
        });

        var onError = function(error) {
          deferred.reject(error);
        };

        options = {keyRange: moduleKeyRange, onError: onError};

        data.trialsDB.query(
          function(data) {
            deferred.resolve(data);
          }, options);
      }
     
      data.openTrialsDB(userName, queryTrials);

      return deferred.promise;
    };

    return data;

  }]);