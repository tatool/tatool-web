'use strict';

angular.module('tatool.app')
  .factory('publicService', [ function () {

    var publicStart = {};

    publicStart.getModuleId = function() {
      return this.module.moduleId;
    };

    publicStart.getModule = function() {
      return this.module;
    };

    publicStart.getExtId = function() {
      return this.extId;
    };

    publicStart.getSessionToken = function() {
      return this.module.lastSessionToken;
    };

    publicStart.setModule = function(module) {
      this.module = module;
    };

    publicStart.setExtId = function(extId) {
      this.extId = extId;
    };

    return publicStart;

  }]);