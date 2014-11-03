'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('RunCtrl', ['$scope', '$window', '$state', '$sce', 'spinnerService', 'cfg',
    function ($scope, $window, $state, $sce, spinnerService, cfg) {

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

    var goBack = function() {
      if (mode === cfg.APP_MODE_DEVELOPER) {
          $state.go('developer');
        } else {
          $state.go('home');
      }
    };

    $window.addEventListener('message', moduleListener, false);

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
      $scope.moduleUrl = $sce.trustAsResourceUrl('../../views/module/index.html');
    } else {
      if (mode === cfg.APP_MODE_DEVELOPER) {
        $state.go('developer');
      } else {
        $state.go('home');
      }
    }
    
  }]);