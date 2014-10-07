'use strict';

angular.module('tatool.app')
  .controller('ModuleCtrl', ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', 'dataService', 'cfgApp', 'authService', 'userService', 'moduleCreatorService', 'exportService', 'usSpinnerService',
    function ($scope, $q, $timeout, $window, $rootScope, $location, $state, dataService, cfgApp, authService, userService, moduleCreatorService, exportService, usSpinnerService) {

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
      dataService.getAllModules().then( function(data) {
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

    dataService.openModulesDB(userService.getUserName(), initModules);

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
        dataService.deleteModule(userService.getUserName(), module.moduleId).then(onModuleDelete, onModuleDeleteError);
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
      // set the moduleId to the session
      $window.sessionStorage.setItem('moduleId', module.moduleId);
      var moduleUrl = module.modulePackagePath + '/index.html';
      $window.location = moduleUrl;
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
