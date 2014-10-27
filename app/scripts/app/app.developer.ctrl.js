'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('DeveloperCtrl', ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', '$http', '$log', 'moduleDataService', 'cfg', 'cfgApp', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'spinnerService',
    function ($scope, $q, $timeout, $window, $rootScope, $location, $state, $http, $log, moduleDataService, cfg, cfgApp, authService, userService, moduleCreatorService, exportService, spinnerService) {

    // setting contants
    $scope.imgPath = cfgApp.IMG_PATH;

    $scope.modules = [];

    $scope.status = {
      'develop': true
    };

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
        if ($scope.modules.length > 0) {
          $scope.status.develop = true;
        }
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
    
    // query modules db and display
    moduleDataService.openModulesDB(userService.getUserName(), cfg.APP_MODE_DEVELOPER, initModules);

    // upload local file
    $scope.addModule = function(e) {

      startSpinner();

      var evt = e || window.event;
      var file = evt.target.files[0];

      function onModuleLoaded(result) {
        stopSpinner();
        $scope.modules.push(result);
        $scope.status.develop = true;
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

    // publish module to repository
    $scope.publishModule = function($event, module, moduleType) {
      $event.stopPropagation();
      startSpinner();

      module.moduleType = moduleType;

      moduleDataService.addModule(module).then(function() {
        moduleDataService.publishModule(module).then(function() {
          stopSpinner();
        }, function(err) {
          $log.error(err);
          stopSpinner();
        });
      }, function(err) {
        $log.error(err);
        stopSpinner();
      });
    };

    // unpublish module from repository
    $scope.unpublishModule = function($event, module) {
      $event.stopPropagation();
      startSpinner();

      moduleDataService.unpublishModule(module).then(function() {
        module.moduleType = '';
        moduleDataService.addModule(module).then(function() {
          stopSpinner();
        }, function(err) {
          $log.error(err);
          stopSpinner();
        });
      }, function(err) {
        $log.error(err);
        stopSpinner();
      });
    };

    // delete module from db
    $scope.deleteModule = function(module) {

      function runDelete() {
        if (module.moduleType === 'public' || module.moduleType === 'private') {
          moduleDataService.unpublishModule(module).then(function() {
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

    // function to initiate start of a module and handover to tatool.module
    $scope.startModule = function(module) {
      // set the moduleId as a session property
      $window.sessionStorage.setItem('moduleId', module.moduleId);
      $window.sessionStorage.setItem('mode', cfg.APP_MODE_DEVELOPER);

      // switch to fullscreen if available
      var fullscreen = module.moduleDefinition.fullscreen ? module.moduleDefinition.fullscreen : false;
      if (fullscreen && screenfull.enabled) {
        screenfull.request();
      }
      // set the module Url as a session property
      var moduleUrl = module.modulePackagePath + '/index.html';
      $state.go('package', {packagePath: moduleUrl}, {location: false});
    };


  }]);
