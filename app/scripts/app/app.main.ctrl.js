'use strict';

angular.module('tatool.app')
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$window', 'authService',
    function ($scope, $rootScope, $state, $window, authService) {

    // remove moduleId from sessionStorage
    $window.sessionStorage.removeItem('moduleId');

    // Handle error in state change
    $rootScope.$on('$stateChangeError', function (event) {
      event.preventDefault();
      $state.go('login');
    });

    $scope.logout = function() {
      authService.logout();
      $state.go('login');
    };

  }]);
