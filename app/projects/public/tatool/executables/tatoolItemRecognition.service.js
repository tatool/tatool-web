'use strict';

tatool
  .factory('tatoolItemRecognition', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {

    var ItemRecognition = executableUtils.createExecutable();

    var ENCODING_DURATION_DEFAULT = 3000;     // encoding of list
    var BLANK_DURATION_DEFAULT = 250;         // between lists in encoding phase
    var INSTRUCTION_DURATION_DEFAULT = 4000; 

    ItemRecognition.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showKeys) {
        this.showKeys = { propertyValue: true };
      } else {
        this.showKeys.propertyValue = (this.showKeys.propertyValue === true) ? true : false;
      }

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolItemRecognition. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.encodingDuration = (this.encodingDuration ) ? this.encodingDuration : ENCODING_DURATION_DEFAULT;
      this.blankDuration = (this.blankDuration ) ? this.blankDuration : BLANK_DURATION_DEFAULT;
      this.instructionDuration = (this.instructionDuration ) ? this.instructionDuration : INSTRUCTION_DURATION_DEFAULT;

      this.timerEncoding = timerUtils.createTimer(this.encodingDuration, false, this);
      this.timerBlank = timerUtils.createTimer(this.blankDuration, false, this);
      this.timerInstruction = timerUtils.createTimer(this.instructionDuration, false, this);

      this.counter = 0;

      this.phase = 1;

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
        deferred.reject('Invalid property settings for Executable tatoolItemRecognition. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    ItemRecognition.prototype.createStimulus = function() {
      this.startTime = 0;
      this.endTime = 0;

      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      // pick stimulus to display
      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      if (this.stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable tatoolItemRecognition. No more stimuli available in current stimuliList.');
      } else {
        this.setupInputKeys(this.stimulus);
        this.phase = this.stimulus.phase;
        this.trial.stimulusValue = this.stimulus.stimulusValue;
        this.trial.correctResponse = this.stimulus.correctResponse;
        this.trial.stimulusType = this.stimulus.stimulusType;
        this.trial.probeType = this.stimulus.probeType;
        this.stimulusService.set(this.stimulus);
      }

      this.counter++;
    };

    ItemRecognition.prototype.setupInputKeys = function(stimulus) {
      this.inputService.removeAllInputKeys();
      stimulus.keyCount = (stimulus.keyCount) ? stimulus.keyCount : 2;
      for (var i = 1; i <= stimulus.keyCount; i++) {
        this.inputService.addInputKey(stimulus['keyCode' + i], stimulus['response' + i], stimulus['keyLabel' + i], stimulus['keyLabelType' + i], !this.showKeys.propertyValue);
      }
    };

    ItemRecognition.prototype.getPhase = function() {
      return this.phase;
    };

    ItemRecognition.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    ItemRecognition.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial);
    };

    // stop executable
    ItemRecognition.prototype.endTask = function() {
      executableUtils.stop();
    };

    return ItemRecognition;

  }]);
