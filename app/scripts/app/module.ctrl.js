'use strict';

angular.module('tatool.app')
  .controller('ModuleCtrl', ['$scope', '$q', '$timeout', '$window', '$rootScope', '$location',  '$state', 'dataService', 'cfgApp', 'authService', 'userService', 'exportService', 'usSpinnerService',
    function ($scope, $q, $timeout, $window, $rootScope, $location, $state, dataService, cfgApp, authService, userService, exportService, usSpinnerService) {
  
    // setting contants
    $scope.imgPath = cfgApp.IMG_PATH;

    $scope.modules = [];

    // read all modules and display
    function initModules() {
      dataService.getAllModules().then( function(response) {
        $scope.modules = [];
        for (var i = 0; i < response.total_rows; i++) {
          $scope.modules.push(response.rows[i].doc);
        }
        $scope.$apply();
      });
    }

    initModules();

    // upload local file
    $scope.addModule = function(e) {

      var evt = e || window.event;
      var file = evt.target.files[0];

      function onModuleLoaded(result) {
        $scope.modules.push(result);
        $scope.highlightModuleId = result.moduleId;
        $timeout(function() { $scope.highlightModuleId = null; }, 1000);
      }

      function onModuleError(result) {
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

      dataService.addModule(file).then(onModuleLoaded, onModuleError);
    };

    // delete module from db
    $scope.deleteModule = function(module) {

      function runDelete() {
        dataService.deleteModule(module.moduleId).then(onModuleDelete, onModuleError);
      }

      function onModuleDelete() {
        initModules();
      }

      function onModuleError(result) {

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
      var moduleUrl = module.modulePackageUrl + '/index.html';
      $window.location = moduleUrl;
    };

    $scope.exportModuleData = function(module) {
      usSpinnerService.spin('loadingSpinner');
      exportService.getAllTrials(module.moduleId).then(function(response) {
        var filename = module.moduleId + '_' + userService.getUserName() +  '.csv';
         usSpinnerService.stop('loadingSpinner');
        download(response, filename, 'data:text/plain');
      }, function(error) {
        usSpinnerService.stop('loadingSpinner');
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
