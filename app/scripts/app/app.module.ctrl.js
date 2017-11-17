'use strict';

/* global screenfull */
/* global async */

import async from 'async';
import bootbox from 'bootbox';
import screenfull from 'screenfull';

ModuleCtrl.$inject = ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', '$http', '$log', '$sce', 'moduleDataService', 'cfgApp', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'spinnerService', 'cfg'];

function ModuleCtrl($scope, $q, $timeout, $window, $rootScope, $location, $state, $http, $log, $sce, moduleDataService, cfgApp, authService, userService, moduleCreatorService, exportService, spinnerService, cfg) {

    // setting contants
    $scope.imgPath = cfgApp.IMG_PATH;

    $scope.alert = {};

    $scope.modules = [];
    $scope.repository = [];
    $scope.invites = [];

    $scope.accordionStatus = {
      'installed': true,
      'public': true,
      'invites': true
    };

    $scope.filterModule = '';

    $scope.repoPaging = {};
    $scope.repoPaging.currentPage = 0;
    $scope.repoPaging.pageSize = 25;

    function startSpinner(text) {
      spinnerService.spin('loadingSpinner', text);
    }

    function stopSpinner() {
      spinnerService.stop('loadingSpinner');
    }

    // read all modules and display
    function initModules() {
      // Initialize installed modules
      startSpinner('Loading modules...');
      moduleDataService.getAllModules().then( function(data) {
        $scope.modules = [];
        $scope.invites = [];
        var moduleIds = [];
        var installedModules = {};

        var readyInstalled = 0;
        for (var i = 0; i < data.length; i++) {
          if (data[i].moduleType === 'private' && data[i].moduleStatus === 'invite') {
            $scope.invites.push(data[i]);
          } else {
            $scope.modules.push(data[i]);
            moduleIds.push(data[i].moduleId);
            installedModules[data[i].moduleId] = {};
            installedModules[data[i].moduleId].currentVersion = parseInt(data[i].moduleVersion);
            installedModules[data[i].moduleId].moduleIndex = readyInstalled;
            readyInstalled++;
          }
        }

        // run auto export on installed modules
        runAutoExport();

        // Initialize repository modules (filtering out installed ones)
        moduleDataService.getRepositoryModules().then( function(data) {
          $scope.repository = [];
          for (var i = 0; i < data.length; i++) {
            var index = moduleIds.indexOf(data[i].moduleId);
            if (index === -1) {
              $scope.repository.push(data[i]);
            } else {
              // display update button if new version available in repository
              if (installedModules[data[i].moduleId].currentVersion < parseInt(data[i].moduleVersion)) {
                $scope.modules[installedModules[data[i].moduleId].moduleIndex].moduleStatus = 'update';
              }
            }
          }

          installedModules = null;

          $scope.repoPaging.numPerPage = Math.ceil($scope.repository.length/$scope.repoPaging.pageSize);
          $scope.repoPaging.currentPage = 0;
          stopSpinner();
        }, function(error) {
          stopSpinner();
          $log.error(error);
        });

      }, function(error) {
        stopSpinner();
        $log.error(error);
      });
    }

    // run auto exports whenever modules are initialized
    function runAutoExport() {
      startSpinner('Exporting data. Please wait...');

      var processModule = function(module, cb) {
        var exportersEnabled = $scope.exporterEnabled(module);
        var exporters = module.moduleDefinition.export;
        if (exportersEnabled) {
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
        if (exporter.enabled === true && exporter.auto === true) {
          exportService.exportModuleData(module, exporter.mode, exporter.target, cfg.APP_MODE_USER).then(function() {
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
    moduleDataService.openModulesDB(userService.getUserName(), cfg.APP_MODE_USER, initModules);

    function preloadData() {
      for (var i = 0; i < tatoolModuleAssets.length; i++) {
        //var img = new Image();
        //img.src = cfgApp.MODULE_IMG_PATH + tatoolModuleAssets[i];
        require('../../images/module/' + tatoolModuleAssets[i]);
        var img = new Image();
        img.src = '../images/' + tatoolModuleAssets[i];
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

    // install a module from the repository
    $scope.installModule = function(module) {
      hideAlert();
      startSpinner();

      function onModuleLoaded(result) {
        stopSpinner();
        initModules();
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

      moduleDataService.installModule(module.moduleId).then(onModuleLoaded, onModuleError);
    };

    $scope.replyInvite = function(module, response) {
      hideAlert();
      startSpinner();
      moduleDataService.replyInvite(module.moduleId, response).then(function(module) {
        stopSpinner();
        initModules();
        if (response === 'accepted') {
          setAlert('success', 'The module <b>' + module.moduleName + '</b> has been installed.');
        } else {
          setAlert('success', 'The module invitation has been declined.');
        }
      }, function() {
        moduleDataService.deleteModule(userService.getUserName(), module.moduleId).then(initModules);
        setAlert('danger', 'The invite is no longer valid and will be removed.');
        stopSpinner();
      });
    };

    // delete module from db
    $scope.deleteModule = function(module) {
      hideAlert();

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

    $scope.exporterEnabled = function(module) {
      var exporterEnabled = false;
      var exporters = module.moduleDefinition.export;
      if (exporters) {
        for (var i = 0; i < exporters.length; i++) {
          if ((exporters[i].mode === 'upload' || exporters[i].mode === 'download') && exporters[i].enabled === true) {
            exporterEnabled = true;
            break;
          }
        }
      }
      return exporterEnabled;
    };

    $scope.filterExporterValues = function(exporter) {
      if ((exporter.mode === 'download' || exporter.mode === 'upload') && exporter.enabled === true) {
        return true;
      } else {
        return false;
      }
    };

    // function to export data
    $scope.doExport = function($event, module, exportMode, exportTarget) {
      $('#dropdownExport').removeClass('open');
      $('#dropdownExportButton').dropdown();

      startSpinner('Exporting data. Please wait...');
      exportService.exportModuleData(module, exportMode, exportTarget, cfg.APP_MODE_USER).then(function() {
        setAlert('success', 'Data successfully exported.');
        stopSpinner();
      }, function(err) {
        $log.error(err);
        setAlert('danger', err);
        stopSpinner();
      });
    };

    // function to initiate start of a module and handover to tatool.module
    $scope.startModule = function(module) {
      // check for session limit
      if (module.moduleMaxSessions && (module.maxSessionId >= module.moduleMaxSessions)) {
        setAlert('danger', 'You have already completed all ' + module.moduleMaxSessions + ' Sessions of this Module.');
      } else {
        // set the moduleId as a session property
        $window.sessionStorage.setItem('moduleId', module.moduleId);
        $window.sessionStorage.setItem('mode', cfg.APP_MODE_USER);

        // switch to fullscreen if available and enabled in module
        var fullscreen = module.moduleDefinition.fullscreen ? module.moduleDefinition.fullscreen : false;
        if (fullscreen && screenfull.enabled) {
          screenfull.request();
        }
      
        // start moduleRunner
        $state.go('run');
      }
    };

    // show module description
    $scope.showDescription = function(module) {
      hideAlert();

      function removeScript(strCode) {
        var html = $(strCode.bold()); 
        html.find('script').remove();
        return html.html();
      }

      bootbox.dialog({
          message: '<div id="moduleDescription">' + removeScript(module.moduleDescription) + '</div>',
          title: '<b>' + module.moduleName + '</b><br><span class="author">' + module.moduleAuthor + '</span>',
          buttons: {
            ok: {
              label: 'Close',
              className: 'btn-default'
            }
          }
        });
    };

    $scope.setModuleFilter = function() {
      if ($scope.query.length >= 2) {
        $scope.filterModule = $scope.query;
      } else {
        $scope.filterModule = '';
      }
    };

    $scope.removeModuleFilter = function() {
      $scope.query = '';
      $scope.filterModule = '';
    };

    var setAlert = function(alertType, alertMessage) {
      $scope.alert = {};
      $scope.alert.type = alertType;
      $scope.alert.msg = $sce.trustAsHtml(alertMessage);
      $scope.alert.visible = true;
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    };

    var hideAlert = function() {
      $scope.alert = {};
      $scope.alert.visible = false;
      $scope.alert.msg = '';
    };

    $scope.hideAlert = hideAlert;
}

export default ModuleCtrl;