'use strict';

/* global screenfull */

import bootbox from 'bootbox';
import screenfull from 'screenfull';
import uuidv4  from 'uuid/v4';

import Module from '../common/module.pojo.js';

DeveloperCtrl.$inject = ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', '$http', '$log', '$uibModal', '$sce', 'moduleDataService', 'cfg', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'spinnerService', 'trialDataService', 'cfgApp'];

function DeveloperCtrl($scope, $q, $timeout, $window, $rootScope, $location, $state, $http, $log, $uibModal, $sce, moduleDataService, cfg, authService, userService, moduleCreatorService, exportService, spinnerService, trialDataService, cfgApp) {

    $scope.modules = [];
    $scope.alert = {};

    $scope.accordionStatus = {
      'develop': true
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

    function startSpinner(text) {
      spinnerService.spin('loadingSpinner', text);
    }

    function stopSpinner() {
      spinnerService.stop('loadingSpinner');
    }

    // read all modules and display
    function initModules() {
      startSpinner('Loading modules...');

      moduleDataService.getAllModules().then( function(data) {
        $scope.modules = [];
        for (var i = 0; i < data.length; i++) {
          $scope.modules.push(data[i]);
        }
        if ($scope.modules.length > 0) {
          $scope.accordionStatus.develop = true;
        }
        stopSpinner();
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
    }
    
    // query modules db and display
    moduleDataService.openModulesDB(userService.getUserName(), cfg.APP_MODE_DEVELOPER, initModules);

    // upload local file
    $scope.addModule = function(e) {
      e.preventDefault();
      hideAlert();

      startSpinner();

      var evt = e || window.event;
      var file = evt.target.files[0];

      function onModuleLoaded(result) {
        stopSpinner();
        $scope.modules.push(result);
        $scope.accordionStatus.develop = true;
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

    // open module editor
    $scope.editModule = function(module) {
      hideAlert();

      var modalInstance = $uibModal.open({
        template: require('../../views/app/edit.html'),
        controller: 'EditCtrl',
        size: 'lg',
        keyboard: false,
        backdrop : 'static',
        resolve: {
          module: function () {
            return module;
          }
        }
      });

      modalInstance.result.then(function() {
        // increment module version
        module.moduleVersion++;
        moduleDataService.addModule(module).then(function() {
          setAlert('success', 'Module successfully saved.');
          initModules();
        }, function(error) {
          setAlert('danger', error);
          initModules();
        });
      }, function() {
        initModules();
      });
    };

    // toggle repository functionality
    $scope.toggleRepository = function($event, module) {

      // unpublish module
      function unpublish() {
        startSpinner();
        moduleDataService.unpublishModule(module.moduleId).then(function() {
          module.moduleType = '';
          module.publishedModuleVersion = 0;
          stopSpinner();
        }, function(err) {
          $log.error(err);
          stopSpinner();
        });
      }

      if (module.moduleType) {
        bootbox.dialog({
          message: 'By disabling the Repository, the module will be unpublished. Are you sure you want to continue?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: unpublish
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });
        
      } else {
        startSpinner();
        module.moduleType = 'public';
        moduleDataService.addModule(module).then(function() {
          stopSpinner();
        }, function(error) {
          module.moduleType = '';
          setAlert('danger', error);
          stopSpinner();
        });
      }
    };

    $scope.changeModuleType = function(module) {
      module.moduleVersion++;
    };

    $scope.repositoryInvite = function(moduleId) {
      hideAlert();
      moduleDataService.getRepositoryModule(moduleId).then(function(module) {
        if (module && module.moduleType === 'private') {
          $uibModal.open({
            template: require('../../views/app/invite.html'),
            controller: 'InviteCtrl',
            size: 'lg',
            resolve: {
              module: function () {
                return module;
              }
            }
          });
        } else if (module) {
          setAlert('info', 'The module <b>\'' + module.moduleName + '\'</b> needs to be published as a <b>private</b> module before you can invite users.');
        } else {
          setAlert('danger', 'The module was not found.');
        }
      }, function() {
        setAlert('danger', 'The module needs to be published as a <b>private</b> module before you can invite users.');
      });
    };

    // publish module to repository
    $scope.publishModule = function($event, module) {
      $event.stopPropagation();
      startSpinner();

      moduleDataService.publishModule(module.moduleId, module.moduleType).then(function() {
        module.publishedModuleVersion = module.moduleVersion;
        stopSpinner();
        setAlert('success', 'Module <b>\'' + module.moduleName + '\'</b> was published successfully.');
      }, function(err) {
        $log.error(err);
        stopSpinner();
      });
    };

    $scope.showPublicUrl = function(moduleId) {
      var url = 'http://' + window.location.host + '/#/public/' + moduleId;
      var msg = 'The module can be accessed with the following URL:<br><br><span class="publicUrl">';
      msg += url;
      msg += '</span><br><br>By providing the query parameter <b>extid</b>, you can pass in an external id to identify the requestor.';
      msg += 'The external id will be visible in the Analytics tab.<br><br><span class="publicUrl">';
      msg += url;
      msg += '?extid=[xyz]</span>';
      bootbox.dialog({
          message: msg,
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default'
            }
          }
        });
    };

    // delete module from db
    $scope.deleteModule = function(module) {
      hideAlert();

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

      function runDelete() {
        // if published then unpublish first
        if (module.moduleType === 'public' || module.moduleType === 'private') {
          moduleDataService.unpublishModule(module.moduleId).then(function() {
            module.moduleType = '';
            moduleDataService.deleteModule(userService.getUserName(), module.moduleId).then(function() {
              onModuleDelete();
            }, function(err) {
              onModuleDeleteError(err);
              $log.error(err);
            });
          }, function(err) {
            onModuleDeleteError(err);
            $log.error(err);
          });
        } else {
          moduleDataService.deleteModule(userService.getUserName(), module.moduleId).then(onModuleDelete, onModuleDeleteError);
        }
      }

      bootbox.dialog({
          message: 'Are you sure you want to delete the module <b>\'' + module.moduleName + '\'</b>?<br>If this module is currently published, it will automatically be unpublished.',
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

    // reset module data
    $scope.resetModuleData = function(module) {
      hideAlert();

      function runReset() {

        module.maxSessionId = 0;
        module.sessions = {};
        module.moduleProperties = {};

        trialDataService.deleteModuleTrials(userService.getUserName(), module.moduleId, cfg.APP_MODE_DEVELOPER).then(
          function() {
            moduleDataService.addModule(module).then(function() {
              setAlert('success', 'Module successfully reset.');
            }, function(error) {
              setAlert('danger', error);
            });
          }, function(error) {
            setAlert('danger', error);
          });
      }

      bootbox.dialog({
          message: 'This will clear all of your trial and session data associated with this Module. Are you sure you want to continue?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: runReset
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
          if ((exporters[i].mode === 'download') && exporters[i].enabled === true) {
            exporterEnabled = true;
            break;
          }
        }
      }
      
      return exporterEnabled;
    };

    $scope.filterExporterValues = function(exporter) {
      if ((exporter.mode === 'download') && exporter.enabled === true) {
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
      exportService.exportModuleData(module, exportMode, exportTarget, cfg.APP_MODE_DEVELOPER).then(function() {
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
      // set the moduleId as a session property
      $window.sessionStorage.setItem('moduleId', module.moduleId);
      $window.sessionStorage.setItem('mode', cfg.APP_MODE_DEVELOPER);

      // switch to fullscreen if available and enabled in module
      var fullscreen = module.moduleDefinition.fullscreen ? module.moduleDefinition.fullscreen : false;
      if (fullscreen && screenfull.enabled) {
        screenfull.request();
      }
      
      // start moduleRunner
      $state.go('run');
    };

    $scope.newModule = function($event) {
      $event.stopPropagation();
      $event.preventDefault();
      
      // default moduleDefinition for new modules
      var moduleDefinition = {
        name: 'New Module',
        author: userService.getUserName(),
        label: 'newModule',
        export : [
          { mode: 'upload', auto: true, enabled: true},
          { mode: 'download', enabled: true }
        ],
        allowEscapeKey : true,
        fullscreen : false,
        moduleHierarchy: {
          tatoolType: 'List',
          label: 'Task List',
          iterator: { customType: 'ListIterator', numIterations: 1, order: 'sequential' },
          children: []
        }
      };

      var newModule = new Module(uuidv4());
      newModule.setModuleName(moduleDefinition.name);
      newModule.setModuleAuthor(moduleDefinition.author);
      newModule.setModuleDefinition(moduleDefinition);
      newModule.setModuleLabel(moduleDefinition.label);
      newModule.setExportDelimiter(cfgApp.CSV_DELIMITER);
      newModule.setExportFormat(cfgApp.EXPORT_FORMAT);

      $scope.editModule(newModule);
    };

    $scope.hideAlert = hideAlert;
}

export default DeveloperCtrl;
