'use strict';
/* global IDBStore */

import Sha1 from 'sha1';
import IDBStore from 'idb-wrapper'

TrialDataService.$inject = ['$log', '$q', 'cfg'];

function TrialDataService($log, $q, cfg) {
    $log.debug('TrialDataService: initialized');

    var data = {};

    var dbMode = '';
    var trialsDBready = false;

    data.closeTrialsDB = function() {
      trialsDBready = false;
    };

    data.openTrialsDB = function(userName, mode, callback) {
      if (trialsDBready && mode === dbMode) {
        if (callback !== null) {
          callback();
        }
      } else {
        dbMode = mode;
        var prefix = Sha1(userName);
        var suffix = (dbMode === cfg.APP_MODE_DEVELOPER) ? 'd' : 'u';

        data.trialsDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: prefix + '_' + suffix + '_t',
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
    data.deleteModuleTrials = function(userName, moduleId, mode) {
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

      data.openTrialsDB(userName, mode, deleteTrials);

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
    data.getAllTrials = function(userName, moduleId, mode) {
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
     
      data.openTrialsDB(userName, mode, queryTrials);

      return deferred.promise;
    };

    // get a defined set of trials
    data.getTrials = function(userName, moduleId, startSessionId, endSessionId, mode) {
      var deferred = $q.defer();

      if (!endSessionId) {
        endSessionId = startSessionId;
      }

      function queryTrials() {
        var options = {};
        var moduleKeyRange = data.trialsDB.makeKeyRange({
          lower: moduleId + '_' + ('000000'+ startSessionId).slice(-6) + '_',
          excludeLower: false,
          upper: moduleId + '_' + ('000000'+ endSessionId).slice(-6) + '__',
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
     
      data.openTrialsDB(userName, mode, queryTrials);

      return deferred.promise;
    };

    return data;

}

export default TrialDataService;