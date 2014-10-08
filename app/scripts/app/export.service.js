'use strict';

angular.module('tatool.app')
  .factory('exportService', ['$log', '$q', 'dataService', 'cfgApp', 'userService', function ($log, $q, dataService, cfgApp, userService) {
    $log.debug('ExportService: initialized');

    var exporter = {};

    // get all trials of a module
    exporter.getAllTrials = function(moduleId) {
      var deferred = $q.defer();

      dataService.getAllTrials(userService.getUserName(), moduleId).then(
        function(data) {
          if (data !== undefined && data.length > 0) {
            exportData(moduleId, data).then(
              function(csv) {
                deferred.resolve(csv);
              });
          } else {
            deferred.reject('There is no data to export for this module.');
          }
        }, function(error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // get trials of latest session
    exporter.getSessionTrials = function(module) {
      return getTrials(module.moduleId, module.getMaxSessionId(), null);
    };

    // get all trials starting from a given sessionId
    exporter.getTrialsFromSession = function(moduleId, startSessionId) {
      return getTrials(moduleId, startSessionId, null);
    };

    // get all trials starting and ending with given sessionIds
    exporter.getTrialsFromToSession = function(moduleId, startSessionId, endSessionId) {
      return getTrials(moduleId, startSessionId, endSessionId);
    };

    // private functions
    var getTrials = function(moduleId, startSessionId, endSessionId) {
      var deferred = $q.defer();

      dataService.getTrials(moduleId, startSessionId, endSessionId).then( function(response) {
        if (response.rows.length !== 0) {
          exportData(moduleId, response).then(function(csv) {
            deferred.resolve(csv);
          });
        } else {
          deferred.reject('There is no data to export for this module.');
        }
      }, function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    };

    // return all module properties in a format to be used for exporting
    var getModuleProperties = function(module) {
      var moduleProperties = [];
      var properties = module.moduleProperties;
      angular.forEach(properties, function(value, key) {
          var property = {key: 'module.' + key, value: value, position: -1 };
          moduleProperties.push(property);
        });
      return moduleProperties;
    };

    // return all session properties in a format to be used for exporting
    var getSessionProperties = function(module) {
      var sessionProperties = {};
      var sessions = module.sessions;
      angular.forEach(sessions, function(value) {
        sessionProperties[value.sessionId] = [];
        // add base properties
        var sessionComplete = (value.sessionComplete) ? 1 : 0;
        sessionProperties[value.sessionId].push({key: 'session.complete', value: sessionComplete, position: -1 });
        // loop through user defined properties
        var properties = value.sessionProperties;
        angular.forEach(properties, function(propValue, propKey) {
          var property = {key: 'session.' + propKey, value: propValue, position: -1 };
          sessionProperties[value.sessionId].push(property);
        });
      });
      return sessionProperties;
    };

    function exportData(moduleId, trials) {
      var deferred = $q.defer();

      dataService.getModule(moduleId).then(
        function(response) {
          // prepare module properties
          var moduleProperties = getModuleProperties(response);
          var sessionProperties = getSessionProperties(response);

          var csv = convertToCsv(trials, moduleProperties, sessionProperties);
          deferred.resolve(csv);
        }, function(error) {
          deferred.reject(error);
        });
      return deferred.promise;
    }

    function convertToCsv(allTrials, moduleProperties, sessionProperties) {
      var output = '';
      var trials = allTrials;
      var header = ['userId', 'moduleId', 'sessionId', 'trialId', 'executableId'];
      var prefix = '';

      // add module properties header
      for (var m = 0; m < moduleProperties.length; m++) {
        var property = moduleProperties[m];
        var index = header.push(property.key); // returns the new length of the array
        property.position = index - 1;
      }

      // add session properties header
      angular.forEach(sessionProperties, function(properties) {
        for (var i = 0; i < properties.length; i++) {
          var property = properties[i];
          var index = contains(header, property.key); // making sure we don't add a property twice
          if (index === -1) {
            index = header.push(property.key); // returns the new length of the array
            property.position = index - 1;
          } else {
            property.position = index;
          }
        }
      });

      // loop through all trials
      for (var i = 0; i < trials.length; i++) {
        var currentTrial = trials[i];
        prefix = currentTrial.executableId;

        // create new line and add userId as static first element
        var line = [];
        line.push(userService.getUserName());

        // add module properties
        for (var mpi = 0; mpi < moduleProperties.length; mpi++){
          var mProperty = moduleProperties[mpi];
          line[mProperty.position] = mProperty.value;
        }

        // add session properties depending on session
        var sessProps = sessionProperties[currentTrial.sessionId];
        for (var spi = 0; spi < sessProps.length; spi++){
          var sProperty = sessProps[spi];
          line[sProperty.position] = sProperty.value;
        }

        // add trial properties
        var tIndex = 0;
        for (var key in currentTrial) {
          var prefixedKey = prefix + '.' + key;
 
          // exclude technical keys
          if (key.substring(0,1) !== '_' ) {
            // add header if it doesn't already exist
            tIndex = contains(header, prefixedKey);
            if (tIndex === -1) {
              tIndex = contains(header, key); // making sure we don't add a property twice from our base header
            }
            if (tIndex === -1) {
              tIndex = header.push(prefixedKey) - 1;
            }

            // add trial to array at correct position
            line[tIndex] = currentTrial[key];
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