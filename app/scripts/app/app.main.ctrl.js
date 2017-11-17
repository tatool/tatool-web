'use strict';

MainCtrl.$inject = ['$scope', '$rootScope', '$state', '$window', '$http', 'authService'];

function MainCtrl($scope, $rootScope, $state, $window, $http, authService) {

    $scope.authorized = authService.isAuthenticated();

    var roles = [];

    var mode = '';

    // remove moduleId from sessionStorage
    $window.sessionStorage.removeItem('moduleId');

    // Handle error in state change
    $rootScope.$on('$stateChangeError', function (event) {
      event.preventDefault();
      $state.go('login');
    });

    // Handle successful state change
    $rootScope.$on('$stateChangeSuccess', function (event, toState) {
      event.preventDefault();

      // set current state as ui-router doesn't do it for us
      $state.current = toState;

      // only request roles when user is logged in (used for header nav)
      if (authService.isAuthenticated()) {
        authService.getRoles().then(function(data) {
          if (data) {
            roles = data;
          }
        });
      }
    });

    // get the run mode from the server
    $http.get('/mode')
      .success(function (data) {
        mode = data.mode;
      })
      .error(function () {
        mode = '';
      });

    $scope.logout = function() {
      authService.logout();
      $state.go('login');
    };

    $scope.hasRole = function(role) {
      return roles.indexOf(role) !== -1;
    };

    $scope.getMode = function() {
      return mode;
    };

    $rootScope.$on('login', function() {
      $scope.authorized = authService.isAuthenticated();
    });

    $rootScope.$on('logout', function() {
      $scope.authorized = authService.isAuthenticated();
    });

}

export default MainCtrl;