'use strict';

angular.module('tatool.auth')
  .controller('LoginCtrl', ['$scope', '$log', '$state', '$sce', 'authService', 'userService',
    function ($scope, $log, $state, $sce, authService, userService) {

    $scope.alert = { type: 'danger', msg: '', visible: false };

    // login with authService and redirect if successful
    $scope.login = function(credentials) {
      if (!credentials) {
        $scope.alert.msg = $sce.trustAsHtml('Please enter all required fields:<br> <li> Email<li> Password');
        $scope.alert.visible = true;
      } else if (!credentials.userName || !credentials.userPassword) {
        var alertText = 'Please enter all required fields:<br>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword) ? '<li> Password' : '';
        $scope.alert.msg = $sce.trustAsHtml(alertText);
        $scope.alert.visible = true;
        $scope.credentials.userName = '';
        $scope.credentials.userPassword = '';
      } else {
        authService.login(credentials).then(function() {
          $state.go('home');
        }, function(error) {
          $scope.alert.msg = $sce.trustAsHtml(error);
          $scope.alert.visible = true;
          $scope.credentials.userName = '';
          $scope.credentials.userPassword = '';
        });
      }
    };

    // register new user
    $scope.register = function(credentials) {
      if (!credentials) {
        $scope.alert.msg = $sce.trustAsHtml('Please enter all required fields:<br> <li> Email<li> Password<li> Year of birth<li> Sex');
        $scope.alert.visible = true;
      } else if (!credentials.userName || !credentials.userPassword || !credentials.year || !credentials.sex) {
        var alertText = 'Please enter all required fields:<br>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword) ? '<li> Password' : '';
        alertText += (!credentials.year) ? '<li> Year of birth' : '';
        alertText += (!credentials.sex) ? '<li> Sex' : '';
        $scope.alert.msg = $sce.trustAsHtml(alertText);
        $scope.alert.visible = true;
      } else {
        $scope.alert.msg = '';
        $scope.alert.visible = false;
        
        userService.addUser(credentials).then(function() {
          $state.go('login');
        }, function(error) {
          $scope.alert.msg = $sce.trustAsHtml(error);
          $scope.alert.visible = true;
        });
      }
    };

  }]);
