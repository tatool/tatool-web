'use strict';

tatool
  .factory('tatoolObjectLocation', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var ChoiceReaction = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;
    var INTERVAL_DURATION_DEFAULT = 400;
    var FEEDBACK_DURATION_DEFAULT = 3000;

    //  Initialze variables at the start of every session
    ChoiceReaction.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolChoiceReaction. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.tgtGridService = gridServiceFactory.createService(3, 3, 'targetGrid', this.stimuliPath);
      this.srcGridService = gridServiceFactory.createService(1, 6, 'sourceGrid', this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration ) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.feedbackDuration = (this.feedbackDuration ) ? this.feedbackDuration : FEEDBACK_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);
      this.timerFeedbackRecall = timerUtils.createTimer(this.feedbackDuration, false, this);

      // trial counter property
      this.counter = 0;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.stimuliList = list;
            self.totalStimuli = list.length;
            if (self.randomisation === 'full') {
              self.stimuliList = executableUtils.shuffle(self.stimuliList);
            }
            deferred.resolve();
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolChoiceReaction. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // Create stimulus and set properties
    ChoiceReaction.prototype.createStimulus = function() {
      this.startTime = 0;
      this.endTime = 0;
      this.memCounter = 0;

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
        if (this.randomisation === 'full') {
          this.stimuliList = executableUtils.shuffle(this.stimuliList);
        }
      }

      this.tgtGridService.clear().refresh();
      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    ChoiceReaction.prototype.setStimulus = function() {
      this.tgtGridService.addCellAtPosition(this.stimulus['gridPosition' + this.memCounter], {
        stimulusValue: this.stimulus['stimulusValue' + this.memCounter], 
        stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter]
      });
    };

    ChoiceReaction.prototype.setRecallStimuli = function() {
      this.srcGridService.resize(1, this.stimulus.stimulusCount);
      for (var i = 1; i <= this.stimulus.stimulusCount; i++) {
        this.srcGridService.addCellAtPosition(i, {
          stimulusValue: this.stimulus['stimulusValue' + i], 
          stimulusValueType: this.stimulus['stimulusValueType' + i],
          gridCellClass: 'tatoolObjectLocation_fillCell',
          correctResponse: this.stimulus['correctResponse' + i],
        });
      }
    };

    ChoiceReaction.prototype.getPhase = function() {
      return this.phase;
    };

    ChoiceReaction.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response and stop executable
    ChoiceReaction.prototype.processResponse = function(dragCell, dropCell) {
      this.trial = {};
      this.trial.trialNo = this.counter;
      this.trial.setSize = this.stimulus.stimulusCount;
      this.trial.correctResponse = dragCell.data.correctResponse;
      this.trial.givenResponse = dropCell.gridPosition;
      this.trial.stimulusValue = dragCell.data.stimulusValue;
      this.trial.score = (dragCell.data.correctResponse === dropCell.gridPosition) ? 1 : 0;
      return dbUtils.saveTrial(this.trial);
    };

    ChoiceReaction.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return ChoiceReaction;

  }]);
