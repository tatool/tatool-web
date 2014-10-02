'use strict';

angular.module('tatool.module')
  .factory('tatoolInstruction', [ '$log', 'executor',
    function ($log, executor) {

    var tatoolInstruction = function() {
      
    };

    tatoolInstruction.prototype.stopExecution = function() {
      executor.stopExecutable();
    };
    // Return our service object
    return tatoolInstruction;

  }]);
