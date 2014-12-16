'use strict';

angular.module('tatool.module')
  .controller('MainCtrl', ['$rootScope','$scope', '$log', '$timeout', '$state', '$window', 'moduleService', 'userService', 'moduleDataService', 'trialDataService', 'executor', 'cfgModule', 'executableUtils',
    function ($rootScope, $scope, $log, $timeout, $state, $window, moduleService, userService, moduleDataService, trialDataService, executor, cfgModule, executableUtils) {

    $scope.alert = { type: 'danger', msg: '', visible: false };

    var allowEscapeKey = false;

    // get the moduleId from sessionStorage and remove afterwards to prevent the module from re-running after refresh
    var moduleId = $window.sessionStorage.getItem('moduleId');
    var mode = $window.sessionStorage.getItem('mode');
    $window.sessionStorage.removeItem('moduleId');

    $log.debug('Running module (' + mode +'): ' + moduleId);

    // Handle global key press
    $scope.keyPress = function($event){
      if($event.which === 27) { // Escape Key
        if (allowEscapeKey) {
          if (executor.exec) {
            executor.finishExecutable();
          }
          executor.stopModule(true);
        }
      } else {
        var timing = executableUtils.getTiming();
        // workaround fix for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
        if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        $event.keyPressTime = timing;
        $scope.$broadcast('keyPress', $event);
      }
    };

    // Stop execution of module on fullscreen exit
    var appListener = function(e) {
      var message = e.data;
      if (message.type === 'fullscreenExit') {
        if (allowEscapeKey) {
          if (executor.exec) {
            executor.finishExecutable();
          }
          executor.stopModule(true);
        }
      }
    };

    $window.removeEventListener('message', appListener, false);
    $window.addEventListener('message', appListener, false);

    // Handle global mouse press
    $scope.mousePress = function($event){
      // workaround for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
      if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
        $event.timeStamp = new Date().getTime();
      }
      $scope.$broadcast('mousePress', $event);
    };

    // Handle wrong state changes by stopping the current module
    $scope.$on('$stateChangeError', function (event, fromState, toState) {
      console.log('failure in state change:', toState);
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
      moduleDataService.openModulesDB(userService.getUserName(), mode,
        function() {
          trialDataService.openTrialsDB(userService.getUserName(), mode, loadModule);
        });
    } else {
      executor.stopModule(false);
    }

  }]);
