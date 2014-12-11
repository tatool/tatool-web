'use strict';

angular.module('tatool.app')
  .controller('AnalyticsUserCtrl', [ '$scope', '$sce', '$modalInstance', 'user', function ($scope, $sce, $modalInstance, user) {

    $scope.user = user;

    $scope.formatDate = function(date) {
      if (!date) {
        return '-';
      } else {
        return new Date(date).toLocaleString();
      }
    };

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

  }]);
