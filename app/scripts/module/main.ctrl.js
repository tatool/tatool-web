'use strict';

angular.module('tatool.module')
  .controller('MainCtrl', ['$rootScope','$scope', '$log', '$timeout', '$state', '$window', 'moduleService', 'userService', 'dataService', 'executor',
    function ($rootScope, $scope, $log, $timeout, $state, $window, moduleService, userService, dataService, executor) {

    $scope.alert = { type: 'danger', msg: '', visible: false };

    var MIN_EPOCH_MS = 32000000000;

    var allowEscapeKey = false;

    // get the moduleId from sessionStorage and remove afterwards to prevent the module from re-running after refresh
    var moduleId = $window.sessionStorage.getItem('moduleId');
    $window.sessionStorage.removeItem('moduleId');

    $log.debug('Running module: ' + moduleId);

    // Handle global key press
    $scope.keyPress = function($event){
      if($event.which === 27) { // Escape Key
        if (allowEscapeKey) {
          if (executor.exec) {
            executor.abortExecutable();
          }
          executor.stopModule(true);
        }
      } else {
        // workaround fix for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
        if ($event.timeStamp < MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        $scope.$broadcast('keyPress', $event);
      }
    };

    // Handle global mouse press
    $scope.mousePress = function($event){
      // workaround for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
      if ($event.timeStamp < MIN_EPOCH_MS) {
        $event.timeStamp = new Date().getTime();
      }
      $scope.$broadcast('mousePress', $event);
    };

    // Handle wrong state changes by stopping the current module
    $scope.$on('$stateChangeError', function (event) {
      executor.stopModule(false);
      event.preventDefault();
    });

    function loadModule() {

      function onModuleSuccess(data) {
        $log.debug('Main: Start module...');
        allowEscapeKey = data.moduleDefinition.allowEscapeKey ? data.moduleDefinition.allowEscapeKey : false;
        executor.startModule();
      }

      function onModuleError(data) {
        $scope.alert.msg = data;
        $scope.alert.visible = true;
      }

      moduleService.openModule(userService.getUserName(), moduleId).then(onModuleSuccess, onModuleError);
    }

    // Allows to close the alert notification
    $scope.closeAlert = function() {
      $scope.alert.msg = '';
      $scope.alert.visible = false;
    };

    // Run Module
    if (moduleId) {
      dataService.openModulesDB(userService.getUserName(),
        function() {
          dataService.openTrialsDB(userService.getUserName(), loadModule);
        });
    } else {
      executor.stopModule(false);
    }

  }]);
