'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('ModuleCtrl', ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', 'moduleDataService', 'cfgApp', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'usSpinnerService',
    function ($scope, $q, $timeout, $window, $rootScope, $location, $state, moduleDataService, cfgApp, authService, userService, moduleCreatorService, exportService, usSpinnerService) {

    // setting contants
    $scope.imgPath = cfgApp.IMG_PATH;

    $scope.modules = [];

    function startSpinner() {
      usSpinnerService.spin('loadingSpinner');
    }

    function stopSpinner() {
      usSpinnerService.stop('loadingSpinner');
    }

    // read all modules and display
    function initModules() {
      moduleDataService.getAllModules().then( function(data) {
        $scope.modules = [];
        for (var i = 0; i < data.length; i++) {
          $scope.modules.push(data[i]);
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

    $scope.exportModuleData = function(module) {
      startSpinner();
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


  }]);
