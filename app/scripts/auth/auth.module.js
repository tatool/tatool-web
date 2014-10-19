'use strict';

angular.module('tatool.auth', ['tatool', 'base64'])
  .constant('cfgAuth', {
    IMG_PATH: 'images/auth/',
    VIEW_PATH:'views/auth/'
  })
  .config(['$httpProvider', '$stateProvider', 'cfg', 'authServiceProvider', function ($httpProvider, $stateProvider, cfg, authServiceProvider) {

    authServiceProvider.setProvider(cfg.MODE);

    // auth interceptor
    $httpProvider.interceptors.push('authInterceptor');

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

// Authorization Service Provider
angular.module('tatool.auth').provider('authService', function() {
  this.setProvider = function(provider) {
    this.authProvider = provider;
  };
    
  this.$get = ['authLocalService', 'authRemoteService', function(authLocalService, authRemoteService) {

    if(this.authProvider === 'LOCAL') {
      return authLocalService;
    }
        
    if(this.authProvider === 'REMOTE') {
      return authRemoteService;
    }
        
    throw 'No authService available';
  }];
});