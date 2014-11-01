'use strict';

angular.module('tatool.module')
  .service('tatoolExecutable', [ 'cfgModule', function (cfgModule) {

    var executable = {};

    var executor = {};

    // initialize the common executable service
    executable.init = function(runningExecutor, projectUrl) {
      executor = runningExecutor;
      this.projectUrl = projectUrl;
    };

    // returns empty constructor for an executable
    executable.createExecutable = function() {
      return function() { };
    };

    // stops the execution of the current executable
    executable.stopExecutable = function() {
      executor.stopExecutable();
    };

    return executable;
  }]);
