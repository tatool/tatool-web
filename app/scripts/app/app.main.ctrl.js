'use strict';

angular.module('tatool.app')
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$window', 'authService',
    function ($scope, $rootScope, $state, $window, authService) {

    $scope.authorized = authService.isAuthenticated();

    var roles = [];

    // remove moduleId from sessionStorage
    $window.sessionStorage.removeItem('moduleId');

    // Handle error in state change
    $rootScope.$on('$stateChangeError', function (event) {
      event.preventDefault();
      $state.go('login');
    });

    // Handle successful state change
    $rootScope.$on('$stateChangeSuccess', function (event) {
      event.preventDefault();

      // only request roles when user is logged in (used for header nav)
      if (authService.isAuthenticated()) {
        authService.getRoles().then(function(data) {
          if (data) {
            roles = data;
          }
        });
      }
    });

    $scope.logout = function() {
      authService.logout();
      $state.go('login');
    };

    $scope.hasRole = function(role) {
      return roles.indexOf(role) !== -1;
    };

    $rootScope.$on('login', function() {
      $scope.authorized = authService.isAuthenticated();
    });

    $rootScope.$on('logout', function() {
      $scope.authorized = authService.isAuthenticated();
    });

  }]);
