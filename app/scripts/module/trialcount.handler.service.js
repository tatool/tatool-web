'use strict';

TrialCountHandlerService.$inject = ['$log', 'statusPanelService', 'handlerService', 'tatoolPhase'];

function TrialCountHandlerService($log, statusPanelService, handlerService, tatoolPhase) {

    // create a new handler object and set all handler properties
    var TrialCountHandler = function() {
      // preset properties that can be overwritten by properties in module file
      this.trialCounterStart = 1;
      this.reverse = { propertyType: 'Boolean', propertyValue: false};
    };

    // listens to phase changes and triggers the handler
    TrialCountHandler.prototype.processPhase = function(phase) {
      if (phase === tatoolPhase.SESSION_START) {
        this.trialCounter = this.trialCounterStart;
      } else if (phase === tatoolPhase.EXECUTABLE_START) {
        this.updateStatusPanel();
      } else if (phase === tatoolPhase.EXECUTABLE_END) {
        this.processCounter();
      }
    };

    // increment trial counter
    TrialCountHandler.prototype.processCounter = function() {
      if (handlerService.allDualsCompleted(this)) {
        if (!this.reverse.propertyValue) {
          this.trialCounter++;
        } else {
          this.trialCounter--;
        }
      }
    };

    // update the status panel with the new value
    TrialCountHandler.prototype.updateStatusPanel = function() {
      statusPanelService.updateTrialCount(this.trialCounter);
    };

    return TrialCountHandler;    
}

export default TrialCountHandlerService;
