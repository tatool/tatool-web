'use strict';

var tatool = angular.module('tatool', ['ui.bootstrap', 'ui.router'])
  .constant('cfg', {
    MODE: 'REMOTE', // LOCAL or REMOTE
    APP_MODE_USER: 'user',
    APP_MODE_DEVELOPER: 'developer',
  })
  .config(['$stateProvider', '$urlRouterProvider', '$provide', '$controllerProvider',
    function ($stateProvider, $urlRouterProvider, $provide, $controllerProvider) {

    //userDataServiceProvider.setProvider(cfg.MODE);

    tatool.controller = $controllerProvider.register;
    tatool.factory = $provide.factory;
    tatool.service = $provide.service;

    // making sure we always point to root in case of unknown url
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('start', {
        url: '/',
        templateUrl: 'views/start.html',
        controller: 'StartCtrl'
      }).state('about', {
        url: '/about',
        templateUrl: 'views/about.html',
        controller: 'StartCtrl'
      }).state('documentation', {
        url: '/documentation',
        templateUrl: 'views/documentation.html',
        controller: 'StartCtrl'
      });

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

  }])
  .directive('autoFocus', ['$timeout', function($timeout) {
    return {
      restrict: 'AC',
      link: function(scope, element) {
        $timeout(function(){
          element.focus();
        }, 10);
      }
    };
  }]);

/*
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
*/