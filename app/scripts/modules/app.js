'use strict';

import angular from 'angular';
import uibootstrap from 'angular-ui-bootstrap';
import uirouter from 'angular-ui-router';

import UserDataService from '../user.data.service.js';
import TrialDataService from '../trial.data.service.js';
import ModuleDataService from '../module.data.service.js';

var tatool = angular.module('tatool', [uibootstrap, uirouter])
  .constant('cfg', {
    MODE: 'REMOTE', // LOCAL or REMOTE
    APP_MODE_USER: 'user',
    APP_MODE_DEVELOPER: 'developer',
    APP_MODE_PUBLIC: 'public'
  });

// make the variable tatool globally available to provide legacy support for tasks
window.tatool = tatool;

tatool.factory('userDataService', UserDataService);
tatool.factory('trialDataService', TrialDataService);
tatool.factory('moduleDataService', ModuleDataService);

tatool.config(['$stateProvider', '$urlRouterProvider', '$provide', '$controllerProvider', '$logProvider',
    function ($stateProvider, $urlRouterProvider, $provide, $controllerProvider, $logProvider) {

    //userDataServiceProvider.setProvider(cfg.MODE);

    $logProvider.debugEnabled(true);

    tatool.controller = $controllerProvider.register;
    tatool.factory = $provide.factory;
    tatool.service = $provide.service;

    // making sure we always point to root in case of unknown url
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('start', {
        url: '/',
        template: require('../../views/start.html'),
        controller: 'StartCtrl',
        resolve: {
          page: [function() {
            return '';
          }]
        }
      }).state('doc', {
        url: '/doc/:page',
        template: require('../../views/documentation.html'),
        controller: 'StartCtrl',
        resolve: {
          page: ['$state', '$stateParams', function($state, $stateParams) {
            if (!$stateParams.page) {
              return 'start';
            } else {
              return $stateParams.page;
            }
          }]
        }
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

export default tatool.name;