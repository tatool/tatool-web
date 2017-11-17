'use strict';

/* global screenfull */

import screenfull from 'screenfull';

PublicStartCtrl.$inject = ['$scope', '$window', '$state', 'publicService', 'moduleId', 'extid', 'condition', 'moduleDataService'];

function PublicStartCtrl($scope, $window, $state, publicService, moduleId, extid, condition, moduleDataService) {

    $scope.validModule = false;
    publicService.setExtId(extid);
    publicService.setExtCondition(condition);

    if (moduleId !== '') {
      moduleDataService.getPublicModule(moduleId).then(function(module) {
        publicService.setModule(module);
        $scope.moduleTitle = module.moduleName;
        $scope.validModule = true;
      }, function() {
        $state.go('start');
      });
    } else {
      $state.go('start');
    }
    
    $scope.startModule = function() {
      var module = publicService.getModule();
      var fullscreen = module.moduleDefinition.fullscreen ? module.moduleDefinition.fullscreen : false;
      if (fullscreen && screenfull.enabled) {
        screenfull.request();
      }
      $state.go('publicRun');
    };
}

export default PublicStartCtrl;