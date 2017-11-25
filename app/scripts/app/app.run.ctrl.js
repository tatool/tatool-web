'use strict';

/* global screenfull */

import screenfull from 'screenfull';
import bootbox from 'bootbox';

RunCtrl.$inject = ['$scope', '$window', '$state', '$sce', '$timeout', 'spinnerService', 'cfg'];

function RunCtrl($scope, $window, $state, $sce, $timeout, spinnerService, cfg) {

    // module listener
    var moduleListener = function(e) {
      var message = e.data;
      if (message.type === 'moduleLoaded') {
        stopSpinner();
      } else if (message.type === 'moduleExit') {
        if (screenfull.enabled) {
          screenfull.exit();
        }
        $scope.moduleUrl = $sce.trustAsResourceUrl('about:blank');
        $window.removeEventListener('message', moduleListener, false);
        if (screenfull.enabled) {
          $window.removeEventListener(screenfull.raw.fullscreenchange, fullscreenChange, false);
        }
        
        stopSpinner();
        $scope.$apply();

        if (message.errorMessage) {
          bootbox.dialog({
            closeButton: false,
            message: '<b>Tatool encountered an error during the module execution.</b> <br><br>' + message.errorMessage,
            title: '<b>Tatool</b>',
            buttons: {
              ok: {
                label: 'OK',
                className: 'btn-default',
                callback: goBack
              }
            }
          });
        } else {
          goBack();
        }
        
      }
    };

    var fullscreenChange = function() {
      if (!screenfull.isFullscreen) {
        $('#iframe')[0].contentWindow.postMessage({ type: 'fullscreenExit' }, '*');
      }
    };

    var goBack = function() {
      if (mode === cfg.APP_MODE_DEVELOPER) {
        $state.go('developer');
      } else {
        $state.go('home');
      }
    };

    $window.addEventListener('message', moduleListener, false);

    // fullscreen change detection
    if (screenfull.enabled) {
      $window.addEventListener(screenfull.raw.fullscreenchange, fullscreenChange, false);
    }

    var startSpinner = function() {
      spinnerService.spin('loadingSpinner', 'Loading module...');
    };

    var stopSpinner = function() {
      spinnerService.stop('loadingSpinner');
    };

    // remember which mode we're running
    var moduleId = $window.sessionStorage.getItem('moduleId');
    var mode = $window.sessionStorage.getItem('mode');

    // open moduleUrl in Iframe
    if (moduleId) {
      startSpinner();
      $scope.moduleUrl = $sce.trustAsResourceUrl('../../moduleIndex.html#module'); //../../views/module/index.html#module
    } else {
      if (mode === cfg.APP_MODE_DEVELOPER) {
        $state.go('developer');
      } else {
        $state.go('home');
      }
    }
    
}

export default RunCtrl;
