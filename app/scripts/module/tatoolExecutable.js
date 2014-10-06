'use strict';

angular.module('tatool.module')
  .service('tatoolExecutable', ['$log', 
    function ($log) {

    var executable = {};

    var executor = {};

    // initialize the common executable service
    executable.init = function(runningExecutor) {
      executor = runningExecutor;
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
