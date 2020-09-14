'use strict';

/* global screenfull */

import screenfull from 'screenfull';
import async from 'async';

PublicStartCtrl.$inject = ['$scope', '$window', '$state', 'publicService', 'moduleId', 'extid', 'condition', 'forceupload', 'moduleDataService'];

function PublicStartCtrl($scope, $window, $state, publicService, moduleId, extid, condition, forceupload, moduleDataService) {
  $scope.validModule = false;
  $scope.forceupload = forceupload;
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
    if (fullscreen && screenfull.isEnabled) {
      screenfull.request();
    }
    $state.go('publicRun');
  };

  // helper method to allow manual upload of missing data
  $scope.uploadModuleData = function() {
    $state.go('publicUpload');
  };
}

export default PublicStartCtrl;