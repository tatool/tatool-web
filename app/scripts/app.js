'use strict';

angular.module('tatool', ['ui.bootstrap', 'ui.router'])
  .constant('cfg', {
    MODE: 'REMOTE', // LOCAL or REMOTE
    APP_MODE_USER: 'user',
    APP_MODE_DEVELOPER: 'developer',
  })
  .config(['$stateProvider', '$urlRouterProvider', '$provide', 'cfg', 'moduleDataServiceProvider', 'userDataServiceProvider',
    function ($stateProvider, $urlRouterProvider, $provide, cfg, moduleDataServiceProvider, userDataServiceProvider) {
    
    moduleDataServiceProvider.setProvider(cfg.MODE);
    userDataServiceProvider.setProvider(cfg.MODE);

    // making sure we always point to root in case of unknown url
    $urlRouterProvider.otherwise('/');

    // helper function for ui-router to force a reload of a state
    $provide.decorator('$state', ['$delegate', '$stateParams', function($delegate, $stateParams) {
      $delegate.forceReload = function() {
        return $delegate.go($delegate.current, $stateParams, {
          location: false,
          reload: true,
          inherit: false,
          notify: true
        });
      };
      return $delegate;
    }]);

  }]);

// User Data Service Provider
angular.module('tatool').provider('userDataService', function() {
  this.setProvider = function(provider) {
    this.authProvider = provider;
  };
    
  this.$get = ['userDataLocalService', 'userDataRemoteService', function(userDataLocalService, userDataRemoteService) {

    if(this.authProvider === 'LOCAL') {
      return userDataLocalService;
    }
        
    if(this.authProvider === 'REMOTE') {
      return userDataRemoteService;
    }
        
    throw 'No userDataService available';
  }];
});

// Module Data Service Provider
angular.module('tatool').provider('moduleDataService', function() {
  this.setProvider = function(provider) {
    this.authProvider = provider;
  };
    
  this.$get = ['moduleDataLocalService', 'moduleDataRemoteService', function(moduleDataLocalService, moduleDataRemoteService) {

    if(this.authProvider === 'LOCAL') {
      return moduleDataLocalService;
    }
        
    if(this.authProvider === 'REMOTE') {
      return moduleDataRemoteService;
    }
        
    throw 'No moduleDataService available';
  }];
});