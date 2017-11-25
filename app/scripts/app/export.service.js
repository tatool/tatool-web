'use strict';

/* global async */
/* global LZString */

import async from 'async';
import LZString from 'lz-string'

import download from '../common/util/download.js';

ExportService.$inject = ['$log', '$q', '$http', 'moduleDataService', 'trialDataService', 'cfgApp', 'userService', 'publicService'];

function ExportService($log, $q, $http, moduleDataService, trialDataService, cfgApp, userService, publicService) {
    $log.debug('ExportService: initialized');

    var exporter = {};

    // get all trials of a module
    var getAllTrials = function(moduleId) {
      var deferred = $q.defer();

      trialDataService.getAllTrials(userService.getUserName(), moduleId, exporter.api).then(
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

    // get trials of a module defined by session Id
    var getTrials = function(moduleId, startSessionId, endSessionId) {
      var deferred = $q.defer();

      trialDataService.getTrials(userService.getUserName(), moduleId, startSessionId, endSessionId, exporter.api).then( function(data) {
        if (data !== undefined && data.length > 0) {
          exportData(moduleId, data).then(
            function(csv) {
              deferred.resolve(csv);
            });
        } else {
          deferred.resolve([]);
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
      angular.forEach(properties, function(values, element) {
          angular.forEach(values, function(propertyValue, propertyName) {
            var property = {key: 'module.' + element + '.' + propertyName, value: propertyValue, position: -1 };
            moduleProperties.push(property);
          });
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
        var sessionCondition = (value.sessionCondition) ? value.sessionCondition : '';
        console.log(sessionCondition);
        sessionProperties[value.sessionId].push({key: 'session.complete', value: sessionComplete, position: -2 });
        sessionProperties[value.sessionId].push({key: 'session.condition', value: sessionCondition, position: -1 });
        // loop through user defined properties
        var properties = value.sessionProperties;
        angular.forEach(properties, function(values, element) {
          angular.forEach(values, function(propertyValue, propertyName) {
            var property = {key: 'session.' + element + '.' + propertyName, value: propertyValue, position: -1 };
            sessionProperties[value.sessionId].push(property);
          });
        });
      });
      return sessionProperties;
    };

    function convertToCsv(allTrials, moduleProperties, sessionProperties, moduleLabel, delimiter, format) {
      var output = '';
      var trials = allTrials;
      var header = ['userCode', 'extId', 'moduleId', 'sessionId', 'sessionToken', 'trialId', 'executableId'];
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

        // create new line and add userCode and extId as static first elements
        var line = [];
        line.push(userService.getUserCode());
        line.push(publicService.getExtId());

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
          var prefixedKey = (format === 'long') ? key : prefix + '.' + key;
 
          // exclude technical keys
          if (key.substring(0,1) !== '_' ) {
            // add header if it doesn't already exist
            tIndex = contains(header, prefixedKey);
            if (tIndex === -1) {
              if (key === 'moduleId' && moduleLabel) {  // replacing moduleId with moduleLabel if available
                currentTrial[key] = moduleLabel;
              }
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
            text += delimiter;
          }

          line[j] = (line[j] !== undefined && line[j].toString().indexOf(delimiter) > -1) ? '"' + line[j] + '"' : line[j];
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
          headerLine += delimiter;
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


    function exportData(moduleId, trials) {
      var deferred = $q.defer();

      moduleDataService.getModule(moduleId).then(
        function(response) {
          // prepare module properties
          var moduleProperties = getModuleProperties(response);
          var sessionProperties = getSessionProperties(response);
          var delimiter = (response.exportDelimiter) ? response.exportDelimiter : cfgApp.CSV_DELIMITER;
          var format = (response.exportFormat) ? response.exportFormat : 'legacy';

          var csv = convertToCsv(trials, moduleProperties, sessionProperties, response.moduleLabel, delimiter, format);
          deferred.resolve(csv);
        }, function(error) {
          deferred.reject(error);
        });
      return deferred.promise;
    }




    /** ------------------
      Tatool Export Modes
    --------------------**/

    // get export of data
    var downloadExport = function(module) {
      var deferred = $q.defer();
      getAllTrials(module.moduleId).then(function(response) {
        deferred.resolve(response);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    // run local export to node.js host
    var localExport = function(module, exportTarget) {
      var deferred = $q.defer();
      var sessions = [];

      // select sessions where localExport has not been done yet
      angular.forEach(module.sessions, function(session) {
        if (session.localExportDone === undefined || session.localExportDone !== true) {
          sessions.push(session);
        }
      });

      if (sessions.length > 0) {
        // run local export and upload for every session
        async.eachSeries(sessions, localUpload.bind(null, module.moduleId, exportTarget), function(err) {
          if (err) {
            $log.error(err);
            deferred.reject(err);
          } else {
            deferred.resolve(sessions.length);
          }
        });
      } else {
        deferred.resolve(0);
      }
      return deferred.promise;
    };

    var localUpload = function(moduleId, exportTarget, session, callback) {
      getTrials(moduleId, session.sessionId).then(function(data) {
        if (data.length !== 0) {
          var json = { 'trialData': LZString.compressToBase64(data), 'target': exportTarget }; // compressing data
          var api = '/api/' + exporter.api + '/modules/' + moduleId + '/trials/' + session.sessionId;

          $http.post(api, json).then(function() {
            session.localExportDone = true;
            callback();
          }, function(error) {
            callback(error.message);
          });
        } else {
          // no data to export
          session.localExportDone = true;
          callback();
        }
      }, function(error) {
        callback(error.message);
      });
    };

    // run remote export to a different endpoint (e.g. php script)
    var remoteExport = function(module, exportTarget) {
      var deferred = $q.defer();
      var sessions = [];

      // select sessions where localExport has not been done yet
      angular.forEach(module.sessions, function(session) {
        if (session.remoteExportDone === undefined || session.remoteExportDone !== true) {
          sessions.push(session);
        }
      });

      if (sessions.length > 0) {
        // run local export and upload for every session
        async.eachSeries(sessions, remoteUpload.bind(null, module.moduleId, exportTarget), function(err) {
          if (err) {
            $log.error(err);
            deferred.reject(err);
          } else {
            deferred.resolve(sessions.length);
          }
        });
      } else {
        deferred.resolve(0);
      }

      return deferred.promise;
    };

    var remoteUpload = function(moduleId, exportTarget, session, callback) {
      getTrials(moduleId, session.sessionId).then(function(data) {
        if (data.length !== 0) {
          var json = { 'trialData': LZString.compressToBase64(data), 'moduleId': moduleId, 'sessionId': session.sessionId };
          var api = exportTarget;

          $http.post(api, json).then(function() {
            session.remoteExportDone = true;
            callback();
          }, function(error) {
            callback(error.message);
          });
        } else {
          // no data to export
          session.remoteExportDone = true;
          callback();
        }
      }, function(error) {
        callback(error.message);
      });
    };

    // trigger different export modules
    exporter.exportModuleData = function(module, exportMode, exportTarget, mode) {
      var deferred = $q.defer();

      exporter.api = mode;

      switch (exportMode) {
        case 'upload':
          localExport(module, exportTarget).then(function(data) {
            if (data > 0) {
              moduleDataService.addModule(module).then(function() {
                deferred.resolve();
              });
            } else {
              deferred.resolve();
            }
          }, function(error) {
            deferred.reject(error);
          });
          break;
        case 'remote':
          remoteExport(module, exportTarget).then(function(data) {
            if (data > 0) {
              moduleDataService.addModule(module).then(function() {
                deferred.resolve();
              });
            } else {
              deferred.resolve();
            }
          }, function(error) {
            deferred.reject(error);
          });
          break;
        case 'download':
          downloadExport(module).then(function(data) {
            deferred.resolve();
            var moduleName = (module.moduleLabel) ? module.moduleLabel : module.moduleId;
            var filename = moduleName + '_' + userService.getUserCode() +  '.csv';
            download(data, filename, 'text/plain'); // triggers file download (has issues on Safari)
          }, function(error) {
            deferred.reject(error);
          });
          break;
        default:
          deferred.reject('No exporter found.');
      }

      return deferred.promise;
    };

    return exporter;

}

export default ExportService;