'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('PackageCtrl', ['$scope', '$window', '$state', '$sce', 'packagePath', function ($scope, $window, $state, $sce, packagePath) {

    // redirect to packagePath
    $scope.packagePath = $sce.trustAsResourceUrl(packagePath);

    // listen to any message from child window and exit module in any case
    $window.addEventListener('message', function() {
      //var message = e.data;
      if (screenfull.enabled) {
        screenfull.exit();
      }
      $state.go('home');
    }, false);

  }]);
