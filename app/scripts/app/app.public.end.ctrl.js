'use strict';

angular.module('tatool.app')
  .controller('PublicEndCtrl', ['$scope', 'publicService',
    function ($scope, publicService) {

    $scope.sessionToken = publicService.getSessionToken();
    
  }]);
