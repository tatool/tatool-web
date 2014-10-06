'use strict';

angular.module('tatool.app', ['tatool', 'tatool.auth', 'angularSpinner'])
  .constant('cfgApp', {
    IMG_PATH: 'images/app/',
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
      });

  }]);