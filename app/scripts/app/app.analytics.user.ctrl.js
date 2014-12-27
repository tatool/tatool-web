'use strict';

/* global Date */

angular.module('tatool.app')
  .controller('AnalyticsUserCtrl', [ '$scope', '$sce', '$modalInstance', 'user', function ($scope, $sce, $modalInstance, user) {

    $scope.user = user;
    $scope.sessions = Object.keys(user.sessions).map(function(k) { return user.sessions[k]; });


    $scope.formatDate = function(date) {
      if (!date) {
        return '-';
      } else {
        return new Date(Date.parse(date)).toLocaleString();
      }
    };

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

  }]);
