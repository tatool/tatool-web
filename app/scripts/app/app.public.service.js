'use strict';

PublicService.$inject = [];

function PublicService() {

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

    publicStart.getExtCondition = function() {
      return this.extCondition;
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

    publicStart.setExtCondition = function(extCondition) {
      this.extCondition = extCondition;
    };

    return publicStart;

}

export default PublicService;