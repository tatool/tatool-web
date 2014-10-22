'use strict';

angular.module('tatool.app', ['tatool', 'tatool.auth', 'tatool.common'])
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
        url: '/',
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
      }).state('package', {
        url: '/:packagePath',
        templateUrl: 'views/app/package.html',
        controller: 'PackageCtrl',
        resolve: {
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }],
          packagePath: ['$stateParams', function($stateParams) {
            return $stateParams.packagePath;
          }]
        }
      });

  }]);