'use strict';

tatool
  .factory('tatoolComplexSpan', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {  

    var ComplexNumExecutable = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 800;
    var INTERVAL_DURATION_DEFAULT = 400;

    ComplexNumExecutable.prototype.init = function() {
      var promise = executableUtils.createPromise();

      this.phase = 'INIT';

      if (!this.stimuliPath) {
        promise.reject('Invalid property settings for Executable tatoolComplexSpan. Expected property <b>stimuliPath</b> of type Path.');
      }

      if (!this.timerEnabled) {
        this.timerEnabled = { propertyValue: true };
      } else {
        this.timerEnabled.propertyValue = (this.timerEnabled.propertyValue === true) ? true : false;
      }

      // template properties
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService();

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration ) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);

      // trial counter property
      this.counter = 0;

      // prepare stimuliFile
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
          function(list) {
            self.processStimuliFile(list, promise);
          }, function(error) {
            promise.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        promise.reject('Invalid property settings for Executable tatoolComplexSpan. Expected property <b>stimuliFile</b> of type Resource.');
      }
      
      return promise;
    };

    // process stimuli file according to random property
    ComplexNumExecutable.prototype.processStimuliFile = function(list, promise) {
      if (this.randomisation === 'full') {
        this.stimuliList = executableUtils.shuffle(list);
      } else {
        this.stimuliList = list;
      }
      this.totalStimuli = list.length;
      promise.resolve();
    };

    // Create stimulus and set properties
    ComplexNumExecutable.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.digits = [];
      this.memCounter = 0;
      this.respCounter = 0;

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
        if (this.randomisation === 'full') {
          this.stimuliList = executableUtils.shuffle(this.stimuliList);
        }
      }

      var stimulus = null;
      if (this.randomisation === 'full') {
        stimulus = this.createRandomStimulus();
      } else {
        stimulus = this.createNonRandomStimulus();
      }

      if (stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable tatoolComplexSpan. No more stimuli available in current stimuliList.');
      } else {
        this.stimulus = stimulus;
      }

      // increment stimulus index counter
      this.counter++;
    };

    ComplexNumExecutable.prototype.createRandomStimulus = function() {
      // get next ranom stimulus
      var  randomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return randomStimulus;
    };

    ComplexNumExecutable.prototype.createNonRandomStimulus = function() {
      // get next stimulus
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    ComplexNumExecutable.prototype.setStimulus = function() {
      this.stimulusService.set({ stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter], stimulusValue: this.stimulus['stimulusValue' + this.memCounter] });
    };

    ComplexNumExecutable.prototype.setRecallStimulus = function(text) {
      this.stimulusService.setText({ stimulusValue: text });
    };

    ComplexNumExecutable.prototype.getPhase = function() {
      return this.phase;
    };

    ComplexNumExecutable.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response and stop executable
    ComplexNumExecutable.prototype.addTrial = function(givenResponse) {
      this.trial = {};
      this.trial.trialNo = this.counter;
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

    ComplexNumExecutable.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return ComplexNumExecutable;

  }]);
