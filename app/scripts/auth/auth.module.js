'use strict';

angular.module('tatool.auth', [])
  .constant('cfgAuth', {
    IMG_PATH: 'images/auth/',
    VIEW_PATH:'views/auth/'
  })
  .config(['$stateProvider', function ($stateProvider) {
    // application states
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'views/auth/login.html'
      })
      .state('register', {
        url: '/register',
        templateUrl: 'views/auth/register.html'
      });

  }])
  .directive('autoFocus', ['$timeout', function($timeout) {
    return {
      restrict: 'AC',
      link: function(_scope, _element) {
        $timeout(function(){
          _element[0].focus();
        }, 0);
      }
    };
  }]);