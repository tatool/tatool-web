'use strict';

/* global Date */

AnalyticsUserCtrl.$inject = ['$scope', '$sce', '$uibModalInstance', 'user'];

function AnalyticsUserCtrl($scope, $sce, $uibModalInstance, user) {

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
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

}

export default AnalyticsUserCtrl;
