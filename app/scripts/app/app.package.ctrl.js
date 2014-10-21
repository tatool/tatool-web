'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('PackageCtrl', ['$scope', '$window', '$state', '$sce', 'packagePath', 'spinnerService',
    function ($scope, $window, $state, $sce, packagePath, spinnerService) {

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
        $scope.$apply();
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

    startSpinner();

    // redirect to packagePath
    $scope.packagePath = $sce.trustAsResourceUrl(packagePath);


  }]);
