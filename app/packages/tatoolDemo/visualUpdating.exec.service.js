'use strict';

angular.module('tatool.module')
  .factory('visualUpdatingExecutable', [ '$rootScope', 'tatoolExecutable', 'db', 'timerService', 'tatoolGridService', 
    function ($rootScope, tatoolExecutable, db, timerService, tatoolGridService) {  

    // Define our executable service constructor which will be called once for every instance
    var VisualUpdatingExecutable = tatoolExecutable.createExecutable();

    VisualUpdatingExecutable.prototype.init = function() {

    };

    // Return our service object
    return VisualUpdatingExecutable;

  }]);
