'use strict';

angular.module('tatool.module', ['tatool', 'tatool.auth', 'angular-progress-arc'])
  .constant('cfgModule', {
    MODULE_DEFAULT_PROJECT: 'tatool',
    MODULE_IMG_PATH: '../../images/module/',
    MODULE_VIEW_PATH: '',
    MODULE_RESOURCES: ['blank.html', 'fixation.html', 'statuspanel.html', 'tatoolGrid.html', 'tatoolStimulus.html'],
    IMG_PATH: 'images/module/',
    VIEW_PATH:'views/module/',
    DEFAULT_BLANK_INTERVAL: 0,
    DEFAULT_BLANK_INTERVAL_SCREEN: 'blank.html',
    DEFAULT_FIXATION_INTERVAL: 0,
    DEFAULT_FIXATION_INTERVAL_SCREEN: 'fixation.html',
    CSV_DELIMITER: ';',
    MIN_EPOCH_MS: 32000000000
  })
  .constant('tatoolPhase', {
    SESSION_START: 'SESSION_START',
    SESSION_END: 'SESSION_END',
    EXECUTABLE_START: 'EXECUTABLE_START',
    EXECUTABLE_END: 'EXECUTABLE_END',
    TRIAL_SAVE: 'TRIAL_SAVE',
    LEVEL_CHANGE: 'LEVEL_CHANGE'
  })
  .constant('statusUpdate', {
    FEEDBACK: 'FEEDBACK'
  })
  .config(['$stateProvider', '$urlRouterProvider', '$templateCacheProvider', 'cfgModule', function ($stateProvider, $urlRouterProvider, $templateCacheProvider, cfgModule) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('moduleHome', {
        url: '/module',
        templateUrl: cfgModule.MODULE_VIEW_PATH + 'module.html'
      })
      .state('module', {
        url: '/module/:moduleId/:type/:url/:status',
        resolve: {
          status: ['$stateParams', 'contextService', function($stateParams, contextService) {
            var currentExecutable = contextService.getProperty('currentExecutable');
            return currentExecutable.status;
          }],
          service: ['$stateParams', 'executableService', 'contextService', function($stateParams, executableService, contextService) {
            var currentExecutable = contextService.getProperty('currentExecutable');
            return executableService.getExecutable(currentExecutable.name);
          }],
          auth: ['$q', '$state', 'authService', 'userService', function($q, $state, authService, userService) {
            if (authService.isAuthenticated()) {
              return $q.when(userService.getUserName());
            } else {
              return $q.reject('Error!');
            }
          }]
        },
        views: {
          '': {
            templateUrl: cfgModule.MODULE_VIEW_PATH + 'module.html'
          },
          'status@module': {
            templateUrl: function($stateParams) {
              if($stateParams.status === 'true' ) {
                return cfgModule.MODULE_VIEW_PATH + 'statuspanel.html';
              } else {
                return cfgModule.MODULE_VIEW_PATH + 'blank.html';
              }
            },
            controller: 'StatusPanelCtrl'
          },
          'executable@module': {
            templateUrl: function ($stateParams) {
              return $stateParams.url;
            },
            controllerProvider: ['$stateParams', 'contextService', function ($stateParams, contextService) {
              if($stateParams.type === 'custom') {
                return null;
              } else {
                var currentExecutable = contextService.getProperty('currentExecutable');
                return currentExecutable.customType + 'Ctrl';
              }
            }]
          }
        }
      });
  }]);