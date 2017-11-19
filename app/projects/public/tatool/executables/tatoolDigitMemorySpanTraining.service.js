'use strict';

tatool.factory('tatoolDigitMemorySpanTraining', ['executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
  function(executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {

    var MemorySpanTraining = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 800;
    var INTERVAL_DURATION_DEFAULT = 400;
    var RECALL_TEXT_DEFAULT = 'Stimulus';

    MemorySpanTraining.prototype.init = function() {
      this.phase = 'INIT';

      if (!this.suspendAfterEachItem) {
        this.suspendAfterEachItem = {
          propertyValue: true
        };
      }

      if (!this.timerEnabled) {
        this.timerEnabled = {
          propertyValue: true
        };
      } else {
        this.timerEnabled.propertyValue = (this.timerEnabled.propertyValue === true) ? true : false;
      }

      // template properties
      this.recallText = (this.recallText) ? this.recallText : RECALL_TEXT_DEFAULT;
      this.stimulusService = stimulusServiceFactory.createService();
      this.inputService = inputServiceFactory.createService();

      // timing properties
      this.displayDuration = (this.displayDuration) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);

      // levelhandler for adaptivity
      this.levelHandler = (this.levelHandler) ? this.levelHandler : '';

      // static value for number of memoranda per trial
      this.numMemoranda = (this.numMemoranda) ? parseInt(this.numMemoranda) : 0;
    };

    // Create stimulus and set properties
    MemorySpanTraining.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.digits = [];
      this.memCounter = 0;
      this.respCounter = 0;

      var numbers = [];

      // fill numbers array with two-digit numbers from 11 to 99
      for (var i = 11; i < 100; i++) {
        numbers[i - 11] = i;
      }

      // get current level from designated level handler to allow for adaptivity
      var currentLevel = 1;
      var levelHandler = dbUtils.getHandler(this.levelHandler);
      if (levelHandler) {
        currentLevel = dbUtils.getModuleProperty(levelHandler, 'currentLevel');
      }

      this.stimulus = new Array();

      // draw as many numbers as level+1 OR value of numMemoranda property if set
      var nStimuli = (this.numMemoranda > 0) ? this.numMemoranda : currentLevel + 1;

      // create stimulus properties
      this.stimulus['stimulusCount'] = nStimuli;

      for (var j = 1; j < nStimuli + 1; j++) {
      
        this.stimulus['stimulusValueType' + j] = 'text';
        this.stimulus['stimulusValue' + j] = executableUtils.getRandom(numbers);
        this.stimulus['correctResponse' + j] = this.stimulus['stimulusValue' + j];
      }
    };

    MemorySpanTraining.prototype.setStimulus = function() {
      this.stimulusService.set({
        stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter],
        stimulusValue: this.stimulus['stimulusValue' + this.memCounter]
      });
    };

    MemorySpanTraining.prototype.setRecallStimulus = function(text) {
      this.stimulusService.setText({
        stimulusValue: text
      });
    };

    MemorySpanTraining.prototype.getPhase = function() {
      return this.phase;
    };

    MemorySpanTraining.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response and stop executable
    MemorySpanTraining.prototype.addTrial = function(givenResponse) {
      this.trial = {};
      this.trial.setSize = this.stimulus.stimulusCount;
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      this.trial.correctResponse = this.stimulus['correctResponse' + this.respCounter];

      if (this.trial.correctResponse.toString().toLowerCase() == this.trial.givenResponse.toLowerCase()) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }

      return dbUtils.saveTrial(this.trial);
    };

    MemorySpanTraining.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    MemorySpanTraining.prototype.suspendExecution = function() {
      executableUtils.suspend();
    };

    return MemorySpanTraining;

  }
]);