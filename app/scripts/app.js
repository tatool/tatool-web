'use strict';

angular.module('tatool', ['ui.bootstrap', 'ui.router'])
  .constant('cfg', {
    MODE: 'REMOTE' // LOCAL or REMOTE
  })
  .config(['$stateProvider', '$urlRouterProvider', '$provide', 'cfg', 'moduleDataServiceProvider', function ($stateProvider, $urlRouterProvider, $provide, cfg, moduleDataServiceProvider) {
    
    moduleDataServiceProvider.setProvider(cfg.MODE);

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