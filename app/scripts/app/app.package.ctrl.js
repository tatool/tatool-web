'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('PackageCtrl', ['$scope', '$window', '$state', '$sce', 'packagePath', 'usSpinnerService',
    function ($scope, $window, $state, $sce, packagePath, usSpinnerService) {

    startSpinner();

    // redirect to packagePath
    $scope.packagePath = $sce.trustAsResourceUrl(packagePath);

    // listen to any message from child window and exit module in any case
    $window.addEventListener('message', function(e) {
      var message = e.data;
      console.log(message);
      if (message === 'moduleLoaded') {
        stopSpinner();
      } else if (message === 'moduleExit') {
        if (screenfull.enabled) {
          screenfull.exit();
        }
        $state.go('home');
      }
    }, false);

    function startSpinner() {
      usSpinnerService.spin('loadingSpinner');
    }

    function stopSpinner() {
      usSpinnerService.stop('loadingSpinner');
    }

  }]);
