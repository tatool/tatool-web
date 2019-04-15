'use strict';

// vendor modules
import angular from 'angular';
import ngSanitize from 'angular-sanitize';
import uiselect from 'ui-select';

// custom modules
import tatool from './app.js';
import tatoolCommon from './common.module.js';
import tatoolAuth from './auth.module.js';

// custom services
import ModuleCreatorService from '../app/module.creator.service.js';
import ExportService from '../app/export.service.js';
import PublicService from '../app/app.public.service.js';
import RecursionHelper from '../app/app.edit.recursion.js';

// custom controllers
import MainCtrl from '../app/app.main.ctrl.js';
import StartCtrl from '../start.ctrl.js';
import ModuleCtrl from '../app/app.module.ctrl.js';
import DeveloperCtrl from '../app/app.developer.ctrl.js';
import InviteCtrl from '../app/app.invite.ctrl.js';
import EditCtrl from '../app/app.edit.ctrl.js';
import AdminCtrl from '../app/app.admin.ctrl.js';
import AnalyticsCtrl from '../app/app.analytics.ctrl.js';
import AnalyticsUserCtrl from '../app/app.analytics.user.ctrl.js';
import RunCtrl from '../app/app.run.ctrl.js';
import PublicStartCtrl from '../app/app.public.start.ctrl.js';
import PublicRunCtrl from '../app/app.public.run.ctrl.js';
import PublicEndCtrl from '../app/app.public.end.ctrl.js';

// custom directives
import { CustomOnChange, Tree, ChecklistModel } from '../app/app.directive.js';

import 'bootstrap';

// vendor css
import 'ui-select/dist/select.min.css';
import 'angular-ui-bootstrap/dist/ui-bootstrap-csp.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.css';

// custom css
import '../../styles/fonts/module/leaguegothic-regular-webfont.css';
import '../../styles/fonts/module/tatool-icons.css';
import '../../styles/reset.css';
import '../../styles/tatool_app.css';
import '../../styles/tatool_auth.css';
import '../../styles/fonts/app/open-sans-v15-latin-regular.css';

var tatoolApp = angular.module('tatool.app', [tatool, tatoolAuth, tatoolCommon, ngSanitize, uiselect])
  .constant('cfgApp', {
    IMG_PATH: 'images/app/',
    MODULE_IMG_PATH: 'images/module/',
    VIEW_PATH:'views/app/',
    CSV_DELIMITER: ';',
    EXPORT_FORMAT: 'long'
  });

tatoolApp.factory('moduleCreatorService', ModuleCreatorService);
tatoolApp.factory('exportService', ExportService);
tatoolApp.factory('publicService', PublicService);
tatoolApp.factory('recursionHelper', RecursionHelper);

tatoolApp.controller('MainCtrl', MainCtrl);
tatoolApp.controller('StartCtrl', StartCtrl);
tatoolApp.controller('ModuleCtrl', ModuleCtrl);
tatoolApp.controller('DeveloperCtrl', DeveloperCtrl);
tatoolApp.controller('InviteCtrl', InviteCtrl);
tatoolApp.controller('EditCtrl', EditCtrl);
tatoolApp.controller('AdminCtrl', AdminCtrl);
tatoolApp.controller('AnalyticsCtrl', AnalyticsCtrl);
tatoolApp.controller('AnalyticsUserCtrl', AnalyticsUserCtrl);
tatoolApp.controller('RunCtrl', RunCtrl);
tatoolApp.controller('PublicStartCtrl', PublicStartCtrl);
tatoolApp.controller('PublicRunCtrl', PublicRunCtrl);
tatoolApp.controller('PublicEndCtrl', PublicEndCtrl);

tatoolApp.directive('customOnChange', CustomOnChange);
tatoolApp.directive('tree', Tree);
tatoolApp.directive('checklistModel', ChecklistModel);

tatoolApp.config(['$stateProvider', function ($stateProvider) {

    // application states
    $stateProvider
      .state('home', {
        url: '/modules',
        template: require('../../views/app/main.html'),
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
        template: require('../../views/app/developer.html'),
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
        template: require('../../views/app/analytics.html'),
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
        template: require('../../views/app/admin.html'),
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
        template: require('../../views/app/run.html'),
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
        url: '/public/:moduleId?extid&c',
        template: require('../../views/app/public_start.html'),
        controller: 'PublicStartCtrl',
        resolve: {
          extid: ['$state', '$stateParams', function($state, $stateParams) {
            if (!$stateParams.extid) {
              return '';
            } else {
              return $stateParams.extid;
            }
          }],
          condition: ['$state', '$stateParams', function($state, $stateParams) {
            if (!$stateParams.c) {
              return '';
            } else {
              return $stateParams.c;
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
        template: require('../../views/app/run.html'),
        controller: 'PublicRunCtrl'
      }).state('publicEnd', {
        url: '/public/end',
        template: require('../../views/app/public_end.html'),
        controller: 'PublicEndCtrl'
      });
  }])
  .filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
      };
  });

// populate templateCache for includes
tatoolApp.run(['$templateCache', function($templateCache) {
    // main
    $templateCache.put('header.html', require('../../views/header.html'));
    $templateCache.put('footer.html', require('../../views/footer.html'));
    $templateCache.put('ga.html', require('../../views/ga.html'));
    $templateCache.put('slide-develop.html', require('../../views/slide-develop.html'));
    $templateCache.put('slide-publish.html', require('../../views/slide-publish.html'));
    $templateCache.put('slide-collect.html', require('../../views/slide-collect.html'));
    $templateCache.put('slide-analyse.html', require('../../views/slide-analyse.html'));

    // editor
    $templateCache.put('edit_module.html', require('../../views/app/edit_module.html'));
    $templateCache.put('edit_list.html', require('../../views/app/edit_list.html'));
    $templateCache.put('edit_executable.html', require('../../views/app/edit_executable.html'));
    $templateCache.put('edit_executable_select.html', require('../../views/app/edit_executable_select.html'));
    $templateCache.put('edit_handler.html', require('../../views/app/edit_handler.html'));
    $templateCache.put('edit_executable_property.html', require('../../views/app/edit_executable_property.html'));
    $templateCache.put('edit_executable_property_path.html', require('../../views/app/edit_executable_property_path.html'));
    $templateCache.put('edit_handler_property.html', require('../../views/app/edit_handler_property.html'));
    $templateCache.put('edit_handler_property_path.html', require('../../views/app/edit_handler_property_path.html'));

    // doc
    $templateCache.put('about-cite.html', require('../../views/doc/about-cite.html'));
    $templateCache.put('about-license.html', require('../../views/doc/about-license.html'));
    $templateCache.put('about-publications.html', require('../../views/doc/about-publications.html'));
    $templateCache.put('about-privacy-policy.html', require('../../views/doc/about-privacy-policy.html'));
    $templateCache.put('community-contribute.html', require('../../views/doc/community-contribute.html'));
    $templateCache.put('dev-admin.html', require('../../views/doc/dev-admin.html'));
    $templateCache.put('dev-basics.html', require('../../views/doc/dev-basics.html'));
    $templateCache.put('dev-build.html', require('../../views/doc/dev-build.html'));
    $templateCache.put('dev-executable-additional.html', require('../../views/doc/dev-executable-additional.html'));
    $templateCache.put('dev-executable-create-stimuli.html', require('../../views/doc/dev-executable-create-stimuli.html'));
    $templateCache.put('dev-executable-data.html', require('../../views/doc/dev-executable-data.html'));
    $templateCache.put('dev-executable-display-stimuli.html', require('../../views/doc/dev-executable-display-stimuli.html'));
    $templateCache.put('dev-executable-input.html', require('../../views/doc/dev-executable-input.html'));
    $templateCache.put('dev-executable-project.html', require('../../views/doc/dev-executable-project.html'));
    $templateCache.put('dev-executable-properties.html', require('../../views/doc/dev-executable-properties.html'));
    $templateCache.put('dev-executable-read-stimuli.html', require('../../views/doc/dev-executable-read-stimuli.html'));
    $templateCache.put('dev-executable-templates.html', require('../../views/doc/dev-executable-templates.html'));
    $templateCache.put('dev-executable-timer.html', require('../../views/doc/dev-executable-timer.html'));
    $templateCache.put('dev-executable.html', require('../../views/doc/dev-executable.html'));
    $templateCache.put('dev-getting-started.html', require('../../views/doc/dev-getting-started.html'));
    $templateCache.put('lib-acc-code.html', require('../../views/doc/lib-acc-code.html'));
    $templateCache.put('lib-acc-countdown.html', require('../../views/doc/lib-acc-countdown.html'));
    $templateCache.put('lib-acc-instruction.html', require('../../views/doc/lib-acc-instruction.html'));
    $templateCache.put('lib-acc.html', require('../../views/doc/lib-acc.html'));
    $templateCache.put('lib-bat-uzh-ef-inhibition.html', require('../../views/doc/lib-bat-uzh-ef-inhibition.html'));
    $templateCache.put('lib-bat-uzh-ef-shifting.html', require('../../views/doc/lib-bat-uzh-ef-shifting.html'));
    $templateCache.put('lib-bat-uzh-ef-updating.html', require('../../views/doc/lib-bat-uzh-ef-updating.html'));
    $templateCache.put('lib-bat-uzh-ef.html', require('../../views/doc/lib-bat-uzh-ef.html'));
    $templateCache.put('lib-bat-uzh-luco-linguistic.html', require('../../views/doc/lib-bat-uzh-luco-linguistic.html'));
    $templateCache.put('lib-bat-uzh-luco-monitoring.html', require('../../views/doc/lib-bat-uzh-luco-monitoring.html'));
    $templateCache.put('lib-bat-uzh-luco-wm.html', require('../../views/doc/lib-bat-uzh-luco-wm.html'));
    $templateCache.put('lib-bat-uzh-luco.html', require('../../views/doc/lib-bat-uzh-luco.html'));
    $templateCache.put('lib-bat-uzh-multi.html', require('../../views/doc/lib-bat-uzh-multi.html'));
    $templateCache.put('lib-bat-uzh-multi-testing.html', require('../../views/doc/lib-bat-uzh-multi-testing.html'));
    $templateCache.put('lib-bat-uzh-multi-training.html', require('../../views/doc/lib-bat-uzh-multi-training.html'));
    $templateCache.put('lib-bat-uzh-shifting.html', require('../../views/doc/lib-bat-uzh-shifting.html'));
    $templateCache.put('lib-bat-uzh-shifting-dimension.html', require('../../views/doc/lib-bat-uzh-shifting-dimension.html'));
    $templateCache.put('lib-bat-uzh-shifting-judgment.html', require('../../views/doc/lib-bat-uzh-shifting-judgment.html'));
    $templateCache.put('lib-bat-uzh-shifting-mapping.html', require('../../views/doc/lib-bat-uzh-shifting-mapping.html'));
    $templateCache.put('lib-bat-uzh-shifting-response.html', require('../../views/doc/lib-bat-uzh-shifting-response.html'));
    $templateCache.put('lib-bat-uzh-shifting-set.html', require('../../views/doc/lib-bat-uzh-shifting-set.html'));
    $templateCache.put('lib-bat.html', require('../../views/doc/lib-bat.html'));
    $templateCache.put('lib-exp.html', require('../../views/doc/lib-exp.html'));
    $templateCache.put('lib-exp-brown-peterson.html', require('../../views/doc/lib-exp-brown-peterson.html'));
    $templateCache.put('lib-exp-choice-reactiontime.html', require('../../views/doc/lib-exp-choice-reactiontime.html'));
    $templateCache.put('lib-exp-complex-span.html', require('../../views/doc/lib-exp-complex-span.html'));
    $templateCache.put('lib-exp-corsi-block.html', require('../../views/doc/lib-exp-corsi-block.html'));
    $templateCache.put('lib-exp-flanker.html', require('../../views/doc/lib-exp-flanker.html'));
    $templateCache.put('lib-exp-item-recognition.html', require('../../views/doc/lib-exp-item-recognition.html'));
    $templateCache.put('lib-exp-local-recognition.html', require('../../views/doc/lib-exp-local-recognition.html'));
    $templateCache.put('lib-exp-memory-span.html', require('../../views/doc/lib-exp-memory-span.html'));
    $templateCache.put('lib-exp-monitoring.html', require('../../views/doc/lib-exp-monitoring.html'));
    $templateCache.put('lib-exp-object-location.html', require('../../views/doc/lib-exp-object-location.html'));
    $templateCache.put('lib-exp-shifting.html', require('../../views/doc/lib-exp-shifting.html'));
    $templateCache.put('lib-exp-simon.html', require('../../views/doc/lib-exp-simon.html'));
    $templateCache.put('lib-exp-stroop.html', require('../../views/doc/lib-exp-stroop.html'));
    $templateCache.put('lib-exp.html', require('../../views/doc/lib-exp.html'));
    $templateCache.put('lib-gen.html', require('../../views/doc/lib-gen.html'));
    $templateCache.put('lib-train.html', require('../../views/doc/lib-train.html'));
    $templateCache.put('lib-train-digit-memory-span.html', require('../../views/doc/lib-train-digit-memory-span.html'));
    $templateCache.put('main-about.html', require('../../views/doc/main-about.html'));
    $templateCache.put('main-community.html', require('../../views/doc/main-community.html'));
    $templateCache.put('main-dev.html', require('../../views/doc/main-dev.html'));
    $templateCache.put('main-faq.html', require('../../views/doc/main-faq.html'));
    $templateCache.put('main-lib.html', require('../../views/doc/main-lib.html'));
    $templateCache.put('main-ref.html', require('../../views/doc/main-ref.html'));
    $templateCache.put('main-start.html', require('../../views/doc/main-start.html'));
    $templateCache.put('main-use.html', require('../../views/doc/main-use.html'));
    $templateCache.put('ref-directive-tatoolGrid.html', require('../../views/doc/ref-directive-tatoolGrid.html'));
    $templateCache.put('ref-directive-tatoolInput.html', require('../../views/doc/ref-directive-tatoolInput.html'));
    $templateCache.put('ref-directive-tatoolStimulus.html', require('../../views/doc/ref-directive-tatoolStimulus.html'));
    $templateCache.put('ref-directive.html', require('../../views/doc/ref-directive.html'));
    $templateCache.put('ref-elements.html', require('../../views/doc/ref-elements.html'));
    $templateCache.put('ref-export.html', require('../../views/doc/ref-export.html'));
    $templateCache.put('ref-handler-levelHandler.html', require('../../views/doc/ref-handler-levelHandler.html'));
    $templateCache.put('ref-handler-trialCountHandler.html', require('../../views/doc/ref-handler-trialCountHandler.html'));
    $templateCache.put('ref-handler.html', require('../../views/doc/ref-handler.html'));
    $templateCache.put('ref-properties.html', require('../../views/doc/ref-properties.html'));
    $templateCache.put('ref-service-dbUtils.html', require('../../views/doc/ref-service-dbUtils.html'));
    $templateCache.put('ref-service-executableUtils.html', require('../../views/doc/ref-service-executableUtils.html'));
    $templateCache.put('ref-service-statusPanelUtils.html', require('../../views/doc/ref-service-statusPanelUtils.html'));
    $templateCache.put('ref-service-timerUtils.html', require('../../views/doc/ref-service-timerUtils.html'));
    $templateCache.put('ref-service.html', require('../../views/doc/ref-service.html'));
    $templateCache.put('ref-stimulus.html', require('../../views/doc/ref-stimulus.html'));
    $templateCache.put('start-glossary.html', require('../../views/doc/start-glossary.html'));
    $templateCache.put('use-admin.html', require('../../views/doc/use-admin.html'));
    $templateCache.put('use-analytics.html', require('../../views/doc/use-analytics.html'));
    $templateCache.put('use-editor.html', require('../../views/doc/use-editor.html'));
    $templateCache.put('use-host.html', require('../../views/doc/use-host.html'));
    $templateCache.put('use-modules.html', require('../../views/doc/use-modules.html'));
    $templateCache.put('use-mturk.html', require('../../views/doc/use-mturk.html'));
}]);