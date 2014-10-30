'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('PackageCtrl', ['$scope', '$window', '$state', '$sce', 'packagePath', 'spinnerService', 'cfg',
    function ($scope, $window, $state, $sce, packagePath, spinnerService, cfg) {

    // module listener
    var moduleListener = function(e) {
      var message = e.data;
      if (message === 'moduleLoaded') {
        stopSpinner();
      } else if (message === 'moduleExit') {
        if (screenfull.enabled) {
          screenfull.exit();
        }
        $scope.packagePath = $sce.trustAsResourceUrl('about:blank');
        $window.removeEventListener('message', moduleListener, false);
        stopSpinner();
        $scope.$apply();
        if (mode === cfg.APP_MODE_DEVELOPER) {
          $state.go('developer');
        } else {
          $state.go('home');
        }
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
    var mode = $window.sessionStorage.getItem('mode');

    // redirect to packagePath
    startSpinner();
    $scope.packagePath = $sce.trustAsResourceUrl('../../views/module/index.html');
    
  }]);
