'use strict';

angular.module('tatool.app', ['tatool', 'tatool.auth', 'tatool.common', 'ngAnimate', 'ngSanitize', 'ui.select'])
  .constant('cfgApp', {
    IMG_PATH: 'images/app/',
    MODULE_IMG_PATH: 'images/module/',
    VIEW_PATH:'views/app/',
    CSV_DELIMITER: ';'
  })
  .config(['$stateProvider', function ($stateProvider) {

    // application states
    $stateProvider
      .state('home', {
        url: '/modules',
        templateUrl: 'views/app/main.html',
        controller: 'ModuleCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        }
      }).state('developer', {
        url: '/editor',
        templateUrl: 'views/app/developer.html',
        controller: 'DeveloperCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        }
      }).state('analytics', {
        url: '/analytics',
        templateUrl: 'views/app/analytics.html',
        controller: 'AnalyticsCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        }
      }).state('admin', {
        url: '/admin',
        templateUrl: 'views/app/admin.html',
        controller: 'AdminCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        }
      }).state('run', {
        url: '/run',
        templateUrl: 'views/app/run.html',
        controller: 'RunCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        }
      }).state('public', {
        url: '/public/:moduleId?extid',
        templateUrl: 'views/app/public_start.html',
        controller: 'PublicStartCtrl',
        resolve: {
          extid: ['$state', '$stateParams', function($state, $stateParams) {
            if (!$stateParams.extid) {
              return '';
            } else {
              return $stateParams.extid;
            }
          }],
          moduleId: ['$state', '$stateParams', function($state, $stateParams) {
            if (!$stateParams.moduleId) {
              return '';
            } else {
              return $stateParams.moduleId;
            }
          }]
        }
      }).state('publicRun', {
        url: '/public/run',
        templateUrl: 'views/app/run.html',
        controller: 'PublicRunCtrl'
      }).state('publicEnd', {
        url: '/public/end',
        templateUrl: 'views/app/public_end.html',
        controller: 'PublicEndCtrl'
      });
  }])
  .filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
      };
  });