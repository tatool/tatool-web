'use strict';

/* global screenfull */

angular.module('tatool.app')
  .controller('PublicStartCtrl', ['$scope', '$window', '$state', 'publicService', 'moduleId', 'extid', 'condition', 'moduleDataService',
    function ($scope, $window, $state, publicService, moduleId, extid, condition, moduleDataService) {

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

    
  }]);
