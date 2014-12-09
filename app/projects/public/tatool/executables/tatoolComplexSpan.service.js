'use strict';

tatool
  .factory('tatoolComplexSpan', [ 'tatoolExecutable', 'db', 'timerService', 'tatoolPhase', 'tatoolStimulusService', 'tatoolInputService',
    function (tatoolExecutable, db, timerService, tatoolPhase, tatoolStimulusService, tatoolInputService) {  

    // Define our executable service constructor which will be called once for every instance
    var ComplexNumExecutable = tatoolExecutable.createExecutable();

    ComplexNumExecutable.prototype.init = function() {
      var promise = tatoolExecutable.createPromise();

      this.phase = 'INIT';

      if (!this.stimuliPath) {
        promise.reject('Invalid property settings for Executable tatoolComplexSpan. Expected property stimuliPath of type Path.');
      }

      this.tatoolStimulus = tatoolStimulusService.createStimulus('main', this.stimuliPath);
      this.tatoolInput = tatoolInputService.createInput();

      this.timerDisplayMemoranda = timerService.createTimer(800, true, this);
      this.timerIntervalMemoranda = timerService.createTimer(400, false, this);

      // trial counter property
      this.counter = -1;

      // prepare stimuliFile
      if (this.stimuliFile) {
        var self = this;
        tatoolExecutable.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
          function(list) {
            self.processStimuliFile(list, promise);
          }, function(error) {
            promise.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        promise.reject('Invalid property settings for Executable tatoolComplexSpan. Expected property stimuliFile of type Resource.');
      }
      
      return promise;
    };

    // process stimuli file according to random property
    ComplexNumExecutable.prototype.processStimuliFile = function(list, promise) {
      if (this.random === 'full') {
        this.stimuliList = tatoolExecutable.shuffle(list);
      } else {
        this.stimuliList = list;
      }
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
      this.counter++;

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.stimuliList.length) {
        this.counter = 0;
      }

      var stimulus = null;
      if (this.random === 'full') {
        stimulus = this.createRandomStimulus();
      } else {
        stimulus = this.createNonRandomStimulus();
      }

      if (stimulus === null) {
        tatoolExecutable.fail('Error creating stimulus in Executable tatoolStroop. No more stimuli available in current stimuliList.');
      } else {
        this.stimulus = stimulus;
      }

      // generate new list of digits
      //this.generateDigits();
    };

    ComplexNumExecutable.prototype.createRandomStimulus = function() {
      // get random stimulus
      var  randomStimulus = tatoolExecutable.getRandom(this.stimuliList);
      return randomStimulus;
    };

    ComplexNumExecutable.prototype.createNonRandomStimulus = function() {
      // get next stimulus
      var nonRandomStimulus = tatoolExecutable.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    ComplexNumExecutable.prototype.setStimulus = function() {
      this.tatoolStimulus.set({ stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter], stimulusValue: this.stimulus['stimulusValue' + this.memCounter] });
    };

    ComplexNumExecutable.prototype.setRecallStimulus = function(text) {
      this.tatoolStimulus.setText({ stimulusValue: text });
    };

    ComplexNumExecutable.prototype.generateDigits = function() {
      for (var i = 0; i < 3; i++) {
        var tmpNumber = 10 + (Math.floor((Math.random() * 90) + 1));
        if (this.digits.indexOf(tmpNumber) === -1) {
          this.digits.push(tmpNumber);
        } else {
          i--;
        }
      }
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
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      this.trial.correctResponse = this.stimulus['correctResponse' + this.respCounter];

      if (this.trial.correctResponse.toString().toLowerCase() == this.trial.givenResponse.toLowerCase()) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }

      return db.saveTrial(this.trial);
    };

    ComplexNumExecutable.prototype.stopExecution = function() {
      tatoolExecutable.stop();
    };

    // Return our service object
    return ComplexNumExecutable;

  }]);
