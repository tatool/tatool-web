'use strict';

/* global screenfull */
/* global async */

angular.module('tatool.app')
  .controller('ModuleCtrl', ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', '$http', '$log', 'moduleDataService', 'cfgApp', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'spinnerService',
    function ($scope, $q, $timeout, $window, $rootScope, $location, $state, $http, $log, moduleDataService, cfgApp, authService, userService, moduleCreatorService, exportService, spinnerService) {

    // setting contants
    $scope.imgPath = cfgApp.IMG_PATH;

    $scope.modules = [];

    function startSpinner(text) {
      if (!text) {
        text = 'Please wait...';
      }
      spinnerService.spin('loadingSpinner', text);
    }

    function stopSpinner() {
      spinnerService.stop('loadingSpinner');
    }

    // read all modules and display
    function initModules() {
      moduleDataService.getAllModules().then( function(data) {
        $scope.modules = [];
        for (var i = 0; i < data.length; i++) {
          $scope.modules.push(data[i]);
        }
        runAutoExport();
      }, function(error) {
        bootbox.dialog({
          message: error,
          title: '<b>Tatool</b>',
          buttons: {
            success: {
              label: 'OK',
              className: 'btn-default'
            }
          }
        });
      });
    }

    // run auto exports whenever modules are initialized
    function runAutoExport() {
      startSpinner('Exporting data. Please wait...');

      var processModule = function(module, cb) {
        var exporters = module.moduleDefinition.export;
        if (exporters) {
          // loop through exporters
          async.eachSeries(exporters, exportModule.bind(null, module), function(err) {
            if (err) {
              $log.error(err);
            }
            cb();
          });

        } else {
          cb();
        }
      };

      var exportModule = function(module, exporter, callbackExport) {
        if (exporter.auto === true) {
          exportModuleData(module, exporter.mode, exporter.target).then(function() {
            callbackExport();
          }, function(error) {
            callbackExport(error);
          });
        } else {
          callbackExport();
        }
      };

      // loop through modules
      async.eachSeries($scope.modules, processModule, function(err) {
        if (err) {
          $log.error(err);
        }
        stopSpinner();
      });
    }
    
    // query modules db and display
    moduleDataService.openModulesDB(userService.getUserName(), initModules);

    function preloadData() {
      for (var i = 0; i < tatoolModuleAssets.length; i++) {
        var img = new Image();
        img.src = cfgApp.MODULE_IMG_PATH + tatoolModuleAssets[i];
      }
    }

    // preload general module images
    var tatoolModuleAssets = ['thumbs-down.png','thumbs-empty.png','thumbs-up.png'];
    preloadData();


    // filter exporter set to invisible for ui
    $scope.filterExporter = function(exporter) {
      if (exporter.visible === undefined) {
        return true;
      } else if (exporter.visible === true) {
        return true;
      } else {
        return false;
      }
    };

    // upload local file
    $scope.addModule = function(e) {

      startSpinner();

      var evt = e || window.event;
      var file = evt.target.files[0];

      function onModuleLoaded(result) {
        stopSpinner();
        $scope.modules.push(result);
        $scope.highlightModuleId = result.moduleId;
        $timeout(function() { $scope.highlightModuleId = null; }, 1000);
      }

      function onModuleError(result) {
        stopSpinner();
        bootbox.dialog({
          message: result,
          title: '<b>Tatool</b>',
          buttons: {
            success: {
              label: 'OK',
              className: 'btn-default'
            }
          }
        });
      }

      moduleCreatorService.loadLocalModule(file).then(onModuleLoaded, onModuleError);
    };

    // delete module from db
    $scope.deleteModule = function(module) {

      function runDelete() {
        moduleDataService.deleteModule(userService.getUserName(), module.moduleId).then(onModuleDelete, onModuleDeleteError);
      }

      function onModuleDelete() {
        initModules();
      }

      function onModuleDeleteError(result) {
        bootbox.dialog({
          message: result,
          title: '<b>Tatool</b>',
          buttons: {
            success: {
              label: 'OK',
              className: 'btn-default'
            }
          }
        });
      }

      bootbox.dialog({
          message: 'Are you sure you want to delete the module <b>\'' + module.moduleName + '\'</b>?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: runDelete
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });
    };

    // function to initiate start of a module and handover to tatool.module
    $scope.startModule = function(module) {
      // set the moduleId as a session property
      $window.sessionStorage.setItem('moduleId', module.moduleId);

      // switch to fullscreen if available
      var fullscreen = module.moduleDefinition.fullscreen ? module.moduleDefinition.fullscreen : false;
      if (fullscreen && screenfull.enabled) {
        screenfull.request();
      }
      // set the module Url as a session property
      var moduleUrl = module.modulePackagePath + '/index.html';
      $state.go('package', {packagePath: moduleUrl}, {location: false});
    };


    /** ------------------
      Tatool Export
    --------------------**/

    // created extract of all trials and trigger download (has issues on Safari)
    var downloadExport = function(module) {
      exportService.getAllTrials(module.moduleId).then(function(response) {
        var filename = module.moduleId + '_' + userService.getUserName() +  '.csv';
        stopSpinner();
        download(response, filename, 'text/plain');
      }, function(error) {
        stopSpinner();
        bootbox.dialog({
          message: error,
          title: '<b>Tatool</b>',
          buttons: {
            success: {
              label: 'OK',
              className: 'btn-default'
            }
          }
        });
      });
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
      exportService.getTrials(moduleId, session.sessionId).then(function(data) {
        if (data.length !== 0) {
          var json = { 'trialData': data, 'target': exportTarget };
          var api = '/api/trials/' + moduleId + '/' + session.sessionId;

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
      exportService.getTrials(moduleId, session.sessionId).then(function(data) {
        if (data.length !== 0) {
          var json = { 'trialData': data, 'moduleId': moduleId, 'sessionId': session.sessionId };
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

    $scope.status = {
      isopen: false
    };

    $scope.doExport = function($event, module, exportMode, exportTarget) {
      $event.stopPropagation();

      startSpinner('Exporting data. Please wait...');
      exportModuleData(module, exportMode, exportTarget).then(function() {
        stopSpinner();
      }, function(err) {
        $log.error(err);
        stopSpinner();
      });
    };

    // trigger different export modules
    var exportModuleData = function(module, exportMode, exportTarget) {
      var deferred = $q.defer();

      switch (exportMode) {
        case 'local':
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
          downloadExport(module);
          break;
      }

      return deferred.promise;
    };

  }]);
