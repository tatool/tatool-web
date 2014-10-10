'use strict';

angular.module('tatool.module')
  .factory('visualUpdatingExecutable', [ '$rootScope', '$log', 'tatoolExecutable', 'db', 'timerService', 'tatoolPhase', 
    function ($rootScope, $log, tatoolExecutable, db, timerService, tatoolPhase) {  

    // Define our executable service constructor which will be called once for every instance
    var VisualUpdatingExecutable = tatoolExecutable.createExecutable();

    VisualUpdatingExecutable.prototype.init = function() {
      $log.debug('Initialize Executable with name: ' + this.name);
      
    };


    VisualUpdatingExecutable.prototype.stopExecution = function() {
      //executable.dual = 'SUSPENDED';
      tatoolExecutable.stopExecutable();
    };

    // Return our service object
    return VisualUpdatingExecutable;

  }]);
