'use strict';

import screenfull from 'screenfull';
import bootbox from 'bootbox';

MainCtrl.$inject = ['$rootScope', '$scope', '$log', '$timeout', '$state', '$window', 'moduleService', 'userService', 'moduleDataService', 'trialDataService', 'executorService', 'cfgModule', 'executableUtils', 'tatoolPhase'];

function MainCtrl($rootScope, $scope, $log, $timeout, $state, $window, moduleService, userService, moduleDataService, trialDataService, executorService, cfgModule, executableUtils, tatoolPhase) {

  $scope.alert = {
    type: 'danger',
    msg: '',
    visible: false
  };

  let allowEscapeKey = false;
  let escapePressed = false;
  $scope.moduleStyle = {
    'background-color': '#fff'
  };

  // get the moduleId from sessionStorage and remove afterwards to prevent the module from re-running after refresh
  let moduleId = $window.sessionStorage.getItem('moduleId');
  let mode = $window.sessionStorage.getItem('mode');
  $window.sessionStorage.removeItem('moduleId');

  $log.debug('Running module (' + mode + '): ' + moduleId);

  // don't hide mouse cursor by default
  $scope.hideMouseCursor = false;

  // Handle global key press
  $scope.keyPress = function($event) {
    if ($event.which === 27) { // Escape Key
      if (allowEscapeKey && !escapePressed) {
        escapePressed = true;
        bootbox.dialog({
          message: 'Are you sure you want to exit this module?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: forceExitModule
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default',
              callback: cancelForceExitModule
            }
          }
        });
      }
    } else {
      if (!escapePressed) {
        let timing = executableUtils.getTiming();
        // workaround fix for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
        if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        $event.keyPressTime = timing;
        $scope.$broadcast('keyPress', $event);
      }
    }
  };

  // Stop execution of module on fullscreen exit
  let appListener = function(e) {
    let message = e.data;
    if (message.type === 'fullscreenExit') {
      if (allowEscapeKey && !escapePressed) {
        escapePressed = true;
        bootbox.dialog({
          message: 'Are you sure you want to exit this module?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: forceExitModule
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default',
              callback: cancelForceExitModuleFullscreen
            }
          }
        });
      }
    }
  };

  function forceExitModule() {
    escapePressed = false;
    if (executorService.exec) {
      executorService.finishExecutable();
    }
    moduleService.setSessionForceExit();
    executorService.stopModule(true);
  }

  function cancelForceExitModule() {
    escapePressed = false;
  }

  function cancelForceExitModuleFullscreen() {
    escapePressed = false;
    if (screenfull.isEnabled) {
      screenfull.request();
    }
  }

  $window.removeEventListener('message', appListener, false);
  $window.addEventListener('message', appListener, false);

  // Handle global mouse press
  $scope.mousePress = function($event) {
    // workaround for mozilla as event timestamp shows time in ms since last reboot instead of time since epoch
    if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
      $event.timeStamp = new Date().getTime();
    }
    $scope.$broadcast('mousePress', $event);
  };

  // Handle wrong state changes by stopping the current module
  $scope.$on('$stateChangeError', function(event, fromState, toState) {
    $log.error('Error in stateChange', toState);
    executorService.stopModule(false);
    event.preventDefault();
  });

  // Handle change of mouse cursor visibility triggered by executor
  $scope.$on(tatoolPhase.MOUSE_CURSOR, function(state, hideMouseCursor) {
    if (hideMouseCursor) {
      $scope.hideMouseCursor = true;
    } else {
      $scope.hideMouseCursor = false;
    }
  });

  // Handle executable specific css class
  $scope.$on(tatoolPhase.EXECUTABLE_START, function(state, stack) {
    $scope.executableName = stack.peek().name;
  });

  function loadModule() {

    function onModuleSuccess(data) {
      $log.debug('Main: Start module...');
      allowEscapeKey = data.moduleDefinition.allowEscapeKey ? data.moduleDefinition.allowEscapeKey : false;
      $scope.moduleStyle['background-color'] = data.moduleBackground ? data.moduleBackground : $scope.moduleStyle['background-color'];

      executorService.startModule();
    }

    function onModuleError(data) {
      $scope.alert.msg = data;
      $scope.alert.visible = true;

      executorService.exitModule('Unknown error');
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
    executorService.stopModule(false);
  }

}

export default MainCtrl;