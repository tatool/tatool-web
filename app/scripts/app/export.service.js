'use strict';

angular.module('tatool.app')
  .factory('exportService', ['$log', '$q', 'dataService', 'cfgApp', function ($log, $q, dataService, cfgApp) {
    $log.debug('ExportService: initialized');

    var exporter = {};

    exporter.getAllTrials = function(moduleId) {
      var deferred = $q.defer();

      dataService.getAllTrials(moduleId).then( function(response) {
        var csv = convertToCsv(response);
        deferred.resolve(csv);
      });

      return deferred.promise;
    };

    exporter.getSessionTrials = function(module) {
      return getTrials(module.moduleId, module.getMaxSessionId(), null);
    };

    exporter.getTrialsFromSession = function(moduleId, startSessionId) {
      return getTrials(moduleId, startSessionId, null);
    };

    exporter.getTrialsFromToSession = function(moduleId, startSessionId, endSessionId) {
      return getTrials(moduleId, startSessionId, endSessionId);
    };

    // private functions
    var getTrials = function(moduleId, startSessionId, endSessionId) {
      var deferred = $q.defer();

      dataService.getTrials(moduleId, startSessionId, endSessionId).then( function(response) {
        var csv = convertToCsv(response);
        deferred.resolve(csv);
      });

      return deferred.promise;
    };

    function convertToCsv(json) {

      var output = '';
      var trials = json.rows;
      var excludes = ['moduleId', 'sessionId', 'trialId', 'executableId'];
      var header = ['moduleId', 'sessionId', 'trialId', 'executableId'];
      var prefix = '';

      // loop through all trials
      for (var i = 0; i < trials.length; i++) {
        var currentTrial = trials[i].doc;
        prefix = currentTrial.executableId;

        var line = [];
        var index = 0;
        for (var key in currentTrial) {
          var prefixedKey = prefix + '.' + key;
          // exclude technical keys
          if (key.substring(0,1) !== '_' ) {
            // add header if it doesn't already exist
            index = contains(header, prefixedKey);
            if (index === -1) {
              index = contains(excludes, key);
            }
            if (index === -1) {
              index = header.push(prefixedKey) - 1;
            }

            // add trial to array at correct position
            line[index] = currentTrial[key];
          }
        }

        var text = '';
        // transform array to csv
        for (var j = 0; j < line.length; j++) {
          if (text !== '') {
            text += cfgApp.CSV_DELIMITER;
          }
          text += (line[j] !== undefined) ? line[j] : '';
        }

        if (i < (trials.length - 1)) {
          output += text + '\r\n';
        } else {
          output += text;
        }
          
      }

      var headerLine = '';
      // add header line
      for (var k = 0; k < header.length; k++) {
        if (headerLine !== '') {
          headerLine += cfgApp.CSV_DELIMITER;
        }
        headerLine += header[k];
      }

      output = headerLine + '\r\n' + output;

      return output;
    }

    function contains(arr, obj) {
      for(var i=0; i<arr.length; i++) {
        if (arr[i] === obj) {
          return i;
        }
      }
      return -1;
    }

    return exporter;

  }]);