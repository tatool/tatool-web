'use strict';

angular.module('tatool.auth')
  .controller('LoginCtrl', ['$scope', '$log', '$state', '$sce', 'authService', 'userService', 'messageService',
    function ($scope, $log, $state, $sce, authService, userService, messageService) {

    $scope.alert = { type: 'danger', msg: '', visible: false };

    // login with authService and redirect if successful
    $scope.login = function(credentials) {
      if (!credentials) {
        setAlert('danger', 'Please enter all required fields:<br> <li> Email<li> Password');
      } else if (!credentials.userName || !credentials.userPassword) {
        var alertText = 'Please enter all required fields:<br>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword) ? '<li> Password' : '';
        setAlert('danger', alertText);
        $scope.credentials.userName = '';
        $scope.credentials.userPassword = '';
      } else {
        authService.login(credentials).then(function() {
          $state.go('home');
        }, function(error) {
          setAlert('danger', error);
          $scope.credentials.userName = '';
          $scope.credentials.userPassword = '';
        });
      }
    };

    // register new user
    $scope.register = function(credentials) {
      if (!credentials) {
        setAlert('danger', 'Please enter all required fields:<br> <li> Email<li> Password');
      } else if (!credentials.userName || !credentials.userPassword) {
        var alertText = 'Please enter all required fields:<br>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword) ? '<li> Password' : '';
        setAlert('danger', alertText);
      } else {
        hideAlert();
        
        userService.addUser(credentials).then(function() {
          $state.go('login');
        }, function(error) {
          setAlert('danger', error);
        });
      }
    };

    function setAlert(alertType, alertMessage) {
      $scope.alert.type = alertType;
      $scope.alert.msg = $sce.trustAsHtml(alertMessage);
      $scope.alert.visible = true;
    }

    function hideAlert() {
      $scope.alert.visible = false;
      $scope.alert.msg = '';
    }

    var message = messageService.getMessage();
    if (message.msg !== '') {
      setAlert(message.type, message.msg);
    }

  }]);
