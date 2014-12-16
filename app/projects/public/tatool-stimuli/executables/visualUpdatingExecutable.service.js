'use strict';

tatool
  .factory('visualUpdatingExecutable', [ '$rootScope', 'executableUtils', 'dbUtils', 'timerService', 'gridServiceFactory', 
    function ($rootScope, executableUtils, dbUtils, timerService, gridServiceFactory) {  

    // Define our executable service constructor which will be called once for every instance
    var VisualUpdatingExecutable = executableUtils.createExecutable();

    VisualUpdatingExecutable.prototype.init = function() {

    };

    // Return our service object
    return VisualUpdatingExecutable;

  }]);
