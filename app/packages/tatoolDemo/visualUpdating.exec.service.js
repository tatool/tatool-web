'use strict';

angular.module('tatool.module')
  .factory('visualUpdatingExecutable', [ '$rootScope', '$log', '$q', 'tatoolExecutable', 'db', 'timerService', 'tatoolPhase', 
    function ($rootScope, $log, $q, tatoolExecutable, db, timerService, tatoolPhase) {  

    // Define our executable service constructor which will be called once for every instance
    var VisualUpdatingExecutable = tatoolExecutable.createExecutable();

    VisualUpdatingExecutable.prototype.init = function() {
      var deferred = $q.defer();
      $log.debug('Initialize Executable with name: ' + this.name);

      // preload images
      var img = new Image();
      img.src = 'data/penguine_archigraphs_96x96.png';
      img.onload = function() {
          deferred.resolve('Whatever');
      };

      return deferred;
    };


    VisualUpdatingExecutable.prototype.stopExecution = function() {
      //executable.dual = 'SUSPENDED';
      tatoolExecutable.stopExecutable();
    };

    // Return our service object
    return VisualUpdatingExecutable;

  }]);
