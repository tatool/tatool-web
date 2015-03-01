'use strict';

tatool
  .factory('letterKeepTrack', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var LetterKeepTrack = executableUtils.createExecutable();

    var DISPLAY_ENCODING_DURATION_DEFAULT = 5000;
    var INTERVAL_ENCODING_DURATION_DEFAULT = 250;
    var DISPLAY_UPDATING_DURATION_DEFAULT = 1250;
    var INTERVAL_UPDATING_DURATION_DEFAULT = 250;

    //  Initialze variables at the start of every session
    LetterKeepTrack.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable letterKeepTrack. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridService = gridServiceFactory.createService(3, 3, 'grid', this.stimuliPath);

      // timing properties
      this.displayEncodingDuration = (this.displayEncodingDuration ) ? this.displayEncodingDuration : DISPLAY_ENCODING_DURATION_DEFAULT;
      this.intervalEncodingDuration = (this.intervalEncodingDuration ) ? this.intervalEncodingDuration : INTERVAL_ENCODING_DURATION_DEFAULT;
      this.displayUpdatingDuration = (this.displayUpdatingDuration ) ? this.displayUpdatingDuration : DISPLAY_UPDATING_DURATION_DEFAULT;
      this.intervalUpdatingDuration = (this.intervalUpdatingDuration ) ? this.intervalUpdatingDuration : INTERVAL_UPDATING_DURATION_DEFAULT;
      this.timerDisplayEncoding = timerUtils.createTimer(this.displayEncodingDuration, true, this);
      this.timerIntervalEncoding = timerUtils.createTimer(this.intervalEncodingDuration, false, this);
      this.timerDisplayUpdating = timerUtils.createTimer(this.displayUpdatingDuration, true, this);
      this.timerIntervalUpdating = timerUtils.createTimer(this.intervalUpdatingDuration, false, this);

      // input service: add dynamic keys
      this.inputService = inputServiceFactory.createService(this.stimuliPath);
      this.inputService.addInputKey('B', 'B', null, null, true);
      this.inputService.addInputKey('C', 'C', null, null, true);
      this.inputService.addInputKey('D', 'D', null, null, true);
      this.inputService.addInputKey('F', 'F', null, null, true);
      this.inputService.addInputKey('G', 'G', null, null, true);
      this.inputService.addInputKey('H', 'H', null, null, true);
      this.inputService.addInputKey('J', 'J', null, null, true);
      this.inputService.addInputKey('K', 'K', null, null, true);
      this.inputService.addInputKey('L', 'L', null, null, true);
      this.inputService.addInputKey('M', 'M', null, null, true);
      this.inputService.addInputKey('N', 'N', null, null, true);
      this.inputService.addInputKey('P', 'P', null, null, true);
      this.inputService.addInputKey('Q', 'Q', null, null, true);
      this.inputService.addInputKey('R', 'R', null, null, true);
      this.inputService.addInputKey('S', 'S', null, null, true);
      this.inputService.addInputKey('T', 'T', null, null, true);
      this.inputService.addInputKey('V', 'V', null, null, true);
      this.inputService.addInputKey('X', 'X', null, null, true);
      this.inputService.addInputKey('Z', 'Z', null, null, true);
      this.inputService.addInputKey('W', 'W', null, null, true);

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
        deferred.reject('Invalid property settings for Executable letterPositionUpdating. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // Create stimulus and set properties
    LetterKeepTrack.prototype.createStimulus = function() {
      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    // Set encoding stimuli (all at once)
    LetterKeepTrack.prototype.setEncodingStimuli = function() {
      this.updateStep = 0;
      this.recallStep = 0;
      this.totalUpdatingSteps = 0;

      for (var i = 0; i < this.stimulus['listlength']; i++) {
        this.gridService.addCellAtPosition((i+1), {
          stimulusValue: this.stimulus['letter' + i], 
          stimulusValueType: 'text',
        });
      }
    };

    // Set updating stimulus (one at a time)
    LetterKeepTrack.prototype.setUpdatingStimuli = function() {
      this.updateStep++;
      this.totalUpdatingSteps = this.stimulus['listlength'];

      this.gridService.addCellAtPosition((this.stimulus['updatedPosition'] + 1), {
        stimulusValue: this.stimulus['shownLetter'], 
        stimulusValueType: 'text'
      });

      if (this.updateStep === this.stimulus['listlength']) {
        this.setPhase('RECALL');
      }
    };

    // Set recal stimuli (all colors for one shape)
    LetterKeepTrack.prototype.setRecallStimuli = function() {
      this.recallStep++;
      this.startTime = 0;
      this.endTime = 0;

      // set cue stimulus
      this.gridService.addCellAtPosition(this.recallStep, {
        stimulusValue: '?', 
        stimulusValueType: 'text'
      });

      if (this.recallStep === this.stimulus['listlength']) {
        this.setPhase('ENCODING');
      }
    };

    LetterKeepTrack.prototype.getPhase = function() {
      return this.phase;
    };

    LetterKeepTrack.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response
    LetterKeepTrack.prototype.processResponse = function(givenResponse, timing) {
      this.trial = {};
      this.trial.trialNumber = this.stimulus['trialsno'];
      this.trial.responseNumber = this.stimulus['step'];
      this.trial.nSubstitutions = this.stimulus['nSubstitutions'];
      this.trial.nRepetitions = this.stimulus['nRepetitions'];
      this.trial.nSteps = this.totalUpdatingSteps;
      this.trial.correctResponse = this.stimulus['shownLetter'];
      this.trial.givenResponse = givenResponse;
      this.trial.score = (this.trial.correctResponse === this.trial.givenResponse) ? 1 : 0;
      return dbUtils.saveTrial(this.trial);
    };

    LetterKeepTrack.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return LetterKeepTrack;

  }]);
