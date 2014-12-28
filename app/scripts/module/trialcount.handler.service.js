'use strict';

angular.module('tatool.module')
  .factory('trialCountHandler', ['$log', 'statusPanelService', 'handlerService', 'tatoolPhase',
    function ($log, statusPanelService, handlerService, tatoolPhase) {

    // create a new handler object and set all handler properties
    var TrialCountHandler = function() {
      // internal properties
      this.trialCounter = 1;
    };

    // listens to phase changes and triggers the handler
    TrialCountHandler.prototype.processPhase = function(phase) {
      if (phase === tatoolPhase.SESSION_START) {
        this.trialCounter = 1;
      } else if (phase === tatoolPhase.EXECUTABLE_START) {
        this.updateStatusPanel();
      } else if (phase === tatoolPhase.EXECUTABLE_END) {
        this.processCounter();
      }
    };

    // increment trial counter
    TrialCountHandler.prototype.processCounter = function() {
      if (handlerService.allDualsCompleted(this)) {
        this.trialCounter++;
      }
    };

    // update the status panel with the new value
    TrialCountHandler.prototype.updateStatusPanel = function() {
      //statusPanelService.setInternalTrialCount(this.trialCounter);
      statusPanelService.updateTrialCount(this.trialCounter);
    };

    return TrialCountHandler;    
  }]);
