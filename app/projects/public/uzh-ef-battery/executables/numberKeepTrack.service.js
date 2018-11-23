'use strict';

tatool
  .factory('numberKeepTrack', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var NumberKeepTrack = executableUtils.createExecutable();

    var DISPLAY_ENCODING_DURATION_DEFAULT = 5000;
    var INTERVAL_ENCODING_DURATION_DEFAULT = 250;
    var DISPLAY_UPDATING_DURATION_DEFAULT = 1250;
    var INTERVAL_UPDATING_DURATION_DEFAULT = 250;
    var RECALL_PROMPT_DEFAULT = 'Digit?';

    var COLORS = [ 'red', 'blue', 'green', 'orange' ];

    //  Initialze variables at the start of every session
    NumberKeepTrack.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable digitColorKeepTrack. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridService = gridServiceFactory.createService(3, 3, 'grid', this.stimuliPath);

      // timing properties
      this.displayEncodingDuration = (this.displayEncodingDuration ) ? this.displayEncodingDuration : DISPLAY_ENCODING_DURATION_DEFAULT;
      this.intervalEncodingDuration = (this.intervalEncodingDuration ) ? this.intervalEncodingDuration : INTERVAL_ENCODING_DURATION_DEFAULT;
      this.displayUpdatingDuration = (this.displayUpdatingDuration ) ? this.displayUpdatingDuration : DISPLAY_UPDATING_DURATION_DEFAULT;
      this.intervalUpdatingDuration = (this.intervalUpdatingDuration ) ? this.intervalUpdatingDuration : INTERVAL_UPDATING_DURATION_DEFAULT;
      this.recallPrompt = (this.recallPrompt ) ? this.recallPrompt : RECALL_PROMPT_DEFAULT;
      this.timerDisplayEncoding = timerUtils.createTimer(this.displayEncodingDuration, true, this);
      this.timerIntervalEncoding = timerUtils.createTimer(this.intervalEncodingDuration, false, this);
      this.timerDisplayUpdating = timerUtils.createTimer(this.displayUpdatingDuration, true, this);
      this.timerIntervalUpdating = timerUtils.createTimer(this.intervalUpdatingDuration, false, this);

      // input service: add dynamic keys
      this.inputService = inputServiceFactory.createService(this.stimuliPath);
      this.inputService.addInputKey('Digit1', 1, null, null, true);
      this.inputService.addInputKey('Numpad1', 1, null, null, true);
      this.inputService.addInputKey('Digit2', 2, null, null, true);
      this.inputService.addInputKey('Numpad2', 2, null, null, true);
      this.inputService.addInputKey('Digit3', 3, null, null, true);
      this.inputService.addInputKey('Numpad3', 3, null, null, true);
      this.inputService.addInputKey('Digit4', 4, null, null, true);
      this.inputService.addInputKey('Numpad4', 4, null, null, true);
      this.inputService.addInputKey('Digit5', 5, null, null, true);
      this.inputService.addInputKey('Numpad5', 5, null, null, true);
      this.inputService.addInputKey('Digit6', 6, null, null, true);
      this.inputService.addInputKey('Numpad6', 6, null, null, true);
      this.inputService.addInputKey('Digit7', 7, null, null, true);
      this.inputService.addInputKey('Numpad7', 7, null, null, true);
      this.inputService.addInputKey('Digit8', 8, null, null, true);
      this.inputService.addInputKey('Numpad8', 8, null, null, true);
      this.inputService.addInputKey('Digit9', 9, null, null, true);
      this.inputService.addInputKey('Numpad9', 9, null, null, true);

      // trial counter property
      this.counter = 0;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.stimuliList = list;
            self.totalStimuli = list.length;
            deferred.resolve();
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable digitColorKeepTrack. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // Create stimulus and set properties
    NumberKeepTrack.prototype.createStimulus = function() {
      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    // Set encoding stimuli (all at once)
    NumberKeepTrack.prototype.setEncodingStimuli = function() {
      this.updateStep = 0;
      this.recallStep = 0;
      this.totalUpdatingSteps = 0;

      for (var i = 0; i < this.stimulus['listlength']; i++) {
        this.gridService.addCellAtPosition((i+1), {
          stimulusValue: this.stimulus['item' + i], 
          stimulusValueType: 'text',
          gridCellClass: 'numberKeepTrack_emptyCell ' + 'numberKeepTrack_' + COLORS[i]
        });
      }
    };

    // Set updating stimulus (one at a time)
    NumberKeepTrack.prototype.setUpdatingStimuli = function() {
      this.updateStep++;
      this.totalUpdatingSteps = this.stimulus['listlength'];

      this.gridService.addCellAtPosition(1, {
        stimulusValue: this.stimulus['digit'], 
        stimulusValueType: 'text',
        gridCellClass: 'numberKeepTrack_emptyCell ' + 'numberKeepTrack_' + COLORS[this.stimulus['color']]
      });

      if (this.updateStep === this.stimulus['listlength']) {
        this.setPhase('RECALL');
      }
    };

    // Set recal stimuli (all colors for one shape)
    NumberKeepTrack.prototype.setRecallStimuli = function() {
      this.recallStep++;
      this.startTime = 0;
      this.endTime = 0;

      // set cue stimulus
      this.gridService.addCellAtPosition(1, {
        stimulusValue: this.recallPrompt, 
        stimulusValueType: 'text',
        gridCellClass: 'numberKeepTrack_emptyCell ' + 'numberKeepTrack_' + COLORS[this.stimulus['color']]
      });

      if (this.recallStep === this.stimulus['listlength']) {
        this.setPhase('ENCODING');
      }
    };

    NumberKeepTrack.prototype.getPhase = function() {
      return this.phase;
    };

    NumberKeepTrack.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response
    NumberKeepTrack.prototype.processResponse = function(givenResponse, timing) {
      this.trial = {};
      this.trial.trialNumber = this.stimulus['trialsno'];
      this.trial.responseNumber = this.stimulus['step'];
      this.trial.nSubstitutions = this.stimulus['nsubst'];
      this.trial.nRepetitions = this.stimulus['nrep'];
      this.trial.nSteps = this.totalUpdatingSteps;
      this.trial.correctResponse = this.stimulus['digit'];
      this.trial.givenResponse = givenResponse;
      this.trial.score = (this.trial.correctResponse === this.trial.givenResponse) ? 1 : 0;
      return dbUtils.saveTrial(this.trial);
    };

    NumberKeepTrack.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return NumberKeepTrack;

  }]);
