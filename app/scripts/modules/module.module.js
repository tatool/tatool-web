'use strict';

import angular from 'angular';
import angularprogressarc from 'angular-progress-arc'

// make async and jquery globally available to use in executables
import async from 'async';
window.async = async;
import jquery from 'jquery';
window.$ = window.JQuery = jquery;
import * as Survey from 'survey-jquery';
window.Survey = window.Survey = Survey;
import draggable from 'jquery-ui/ui/widgets/draggable';
import droppable from 'jquery-ui/ui/widgets/droppable';
import mouse from 'jquery-ui/ui/widgets/mouse';
import jqueryuitouchpunch from 'jquery-ui-touch-punch';

// import modules
import tatool from './app.js';
import tatoolCommon from './common.module.js';
import tatoolAuth from './auth.module.js';

// custom services
import ContextService from '../module/context.service.js';
import ErrorHandlerService from '../module/errorhandler.service.js';
import ExecutionPhaseService from '../module/executionphase.service.js';
import TrialService from '../module/trial.service.js';
import StatusPanelService from '../module/statuspanel.service.js';
import TimerUtilsService from '../module/timerUtils.js';
import ExecutableUtilsService from '../module/executableUtils.js';
import DbUtilsService from '../module/dbUtils.js';
import StatusPanelUtilsService from '../module/statusPanelUtils.js';
import ExecutableService from '../module/executable.service.js';
import StimulusServiceFactory from '../module/stimulusServiceFactory.js';
import InputServiceFactory from '../module/inputServiceFactory.js';
import GridServiceFactory from '../module/gridServiceFactory.js';

import HandlerService from '../module/handler.service.js';
import ElementStackService from '../module/elementstack.service.js';
import ExecutorService from '../module/executor.service.js';
import UtilService from '../module/util.service.js';
import ModuleService from '../module/module.service.js';
import ListIterator from '../module/listiterator.service.js';
import TrialCountHandlerService from '../module/trialcount.handler.service.js';
import LevelHandlerService from '../module/level.handler.service.js';

import KeyCodes from '../module/util/keycodes.js';

// custom controllers
import MainCtrl from '../module/main.ctrl.js';
import StatusPanelCtrl from '../module/statuspanel.ctrl.js';

// custom directives
import { Tatool, TatoolInput, TatoolKey, TatoolText, TatoolStimulus, TatoolGrid, TatoolDrag, TatoolDrop } from '../module/module.directive.js';

import 'bootstrap';

// vendor css
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.css';

// custom css
import '../../styles/reset.css';
import '../../styles/tatool_module.css';
import '../../styles/fonts/module/leaguegothic-regular-webfont.css';
import '../../styles/fonts/module/tatool-icons.css';

var tatoolModule = angular.module('tatool.module', [tatool, tatoolAuth, 'angular-progress-arc'])
  .constant('cfgModule', {
    MODULE_DEFAULT_PROJECT: 'tatool',
    MODULE_IMG_PATH: '../../images/module/',
    MODULE_VIEW_PATH: '',
    MODULE_RESOURCES: [],
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
    LEVEL_CHANGE: 'LEVEL_CHANGE',
    MOUSE_CURSOR: 'MOUSE_CURSOR'
  })
  .constant('statusUpdate', {
    FEEDBACK: 'FEEDBACK'
  });

tatoolModule.factory('contextService', ContextService);
tatoolModule.factory('errorHandlerService', ErrorHandlerService);
tatoolModule.factory('executionPhaseService', ExecutionPhaseService);
tatoolModule.factory('trialService', TrialService);
tatoolModule.factory('statusPanelService', StatusPanelService);
tatoolModule.factory('executableUtils', ExecutableUtilsService);
tatoolModule.factory('dbUtils', DbUtilsService);
tatoolModule.factory('timerUtils', TimerUtilsService);
tatoolModule.factory('executableService', ExecutableService);
tatoolModule.factory('handlerService', HandlerService);
tatoolModule.factory('elementStackService', ElementStackService);
tatoolModule.factory('executorService', ExecutorService);
tatoolModule.factory('utilService', UtilService);
tatoolModule.factory('statusPanelUtils', StatusPanelUtilsService);
tatoolModule.factory('moduleService', ModuleService);
tatoolModule.factory('ListIterator', ListIterator);
tatoolModule.factory('stimulusServiceFactory', StimulusServiceFactory);
tatoolModule.factory('inputServiceFactory', InputServiceFactory);
tatoolModule.factory('gridServiceFactory', GridServiceFactory);
tatoolModule.factory('trialCountHandler', TrialCountHandlerService);
tatoolModule.factory('levelHandler', LevelHandlerService);

tatoolModule.controller('MainCtrl', MainCtrl);
tatoolModule.controller('StatusPanelCtrl', StatusPanelCtrl);

tatoolModule.directive('tatool', Tatool);
tatoolModule.directive('tatoolInput', TatoolInput);
tatoolModule.directive('tatoolKey', TatoolKey);
tatoolModule.directive('tatoolText', TatoolText);
tatoolModule.directive('tatoolStimulus', TatoolStimulus);
tatoolModule.directive('tatoolGrid', TatoolGrid);
tatoolModule.directive('tatoolDrag', TatoolDrag);
tatoolModule.directive('tatoolDrop', TatoolDrop);

tatoolModule.config(['$stateProvider', '$urlRouterProvider', '$templateCacheProvider', 'cfgModule', function ($stateProvider, $urlRouterProvider, $templateCacheProvider, cfgModule) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('moduleHome', {
        url: '/module',
        template: require('../../views/module/module.html')
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
            template: require('../../views/module/module.html')
          },
          'status@module': {
            templateUrl: function($stateParams) {
              if($stateParams.status === 'true' ) {
                return 'statuspanel.html'
              } else {
                return 'blank.html';
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

// populate templateCache for includes
tatoolModule.run(['$templateCache', function($templateCache) {
    // main
    $templateCache.put('statuspanel.html', require('../../views/module/statuspanel.html'));
    $templateCache.put('blank.html', require('../../views/module/blank.html'));
    $templateCache.put('fixation.html', require('../../views/module/fixation.html'));
    $templateCache.put('tatoolStimulus.html', require('../../views/module/tatoolStimulus.html'));
    $templateCache.put('tatoolGrid.html', require('../../views/module/tatoolGrid.html'));
}]);