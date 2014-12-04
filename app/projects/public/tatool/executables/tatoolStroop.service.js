'use strict';

tatool
  .factory('tatoolStroop', [ '$log', '$q', 'db', 'timerService', 'tatoolExecutable', 'tatoolStimulusService', 'tatoolInputService',
    function ($log, $q,  db, timerService, tatoolExecutable, tatoolStimulusService, tatoolInputService) {

    // Create a new executable service
    var StroopExecutable = tatoolExecutable.createExecutable();

    //  Initialze variables at the start of every session
    StroopExecutable.prototype.init = function() {
      var deferred = $q.defer();

      // template properties
      this.tatoolStimulus = tatoolStimulusService.createStimulus();
      this.tatoolInput = tatoolInputService.createInput();

      // timing properties
      this.timerDuration = 2000;
      this.timer = timerService.createTimer(this.timerDuration, true, this);

      // trial counter property
      this.counter = -1;

      // load stimuli file from project or external resource
      this.dataPath = (this.dataPath) ? this.dataPath : '';

      // set stimuliFile to default tatool project stimuli file if not set via module file
      if (!this.stimuliFile) {
        this.stimuliFile = 'stroop.csv';
      }

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        tatoolExecutable.getCSVResource(this.stimuliFile, true).then(function(list) {
            self.processStimuliFile(list, deferred);
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolComplexSpan. Expected property stimuliFile of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to random property
    StroopExecutable.prototype.processStimuliFile = function(list, deferred) {
      if (this.random === 'full-condition') {
        this.stimuliList = this.splitStimuliList(list);
      } else if (this.random === 'full') {
        this.stimuliList = tatoolExecutable.shuffle(list);
      } else {
        this.stimuliList = list;
      }
      this.setupInputKeys(list);
      deferred.resolve();
    };

    // Splitting the stimuliList according to stimulusType
    StroopExecutable.prototype.splitStimuliList = function(list) {
      var newList = {};
      for (var i = 0; i < list.length; i++) {
        var stimulusType = list[i].stimulusType; 
        if(!newList[stimulusType]) {
          newList[stimulusType] = [];
        }
        newList[stimulusType].push(list[i]);
      }
      return newList;
    };

    // Adding keyInputs and hide by default
    StroopExecutable.prototype.setupInputKeys = function(list) {
      var keyCodes = [];
      for (var i = 0; i < list.length; i++) {
        if (keyCodes.indexOf(list[i].keyCode) === -1) {
          keyCodes.push(list[i].keyCode);
          this.tatoolInput.addInputKey(list[i].keyCode, list[i].correctResponse, null, true);
        }
      }
      if (keyCodes.length === 0) {
        tatoolExecutable.fail('Error creating tatoolInput in Executable tatoolStroop. No keyCodes provided in stimuliFile.');
      }
    };

    // Create stimulus and set properties
    StroopExecutable.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.counter++;

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.stimuliList.length) {
        this.counter = 0;
      }

      // create new trial
      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      var stimulus = null;
      if (this.random === 'full-condition') {
        stimulus = this.createRandomConditionStimulus();
      } else if (this.random === 'full') {
        stimulus = this.createRandomStimulus();
      } else {
        stimulus = this.createNonRandomStimulus();
      }

      if (stimulus === null) {
        tatoolExecutable.fail('Error creating stimulus in Executable tatoolStroop. No more stimuli available in current stimuliList.');
      } else {
        this.trial.stimulusType = stimulus.stimulusType;
        this.trial.correctResponse = stimulus.correctResponse;
        this.tatoolStimulus.set(stimulus);
      }
    };

    StroopExecutable.prototype.createRandomConditionStimulus = function() {
      // get random stimuliType with replacement
      var stimuli = tatoolExecutable.getRandomReplace(this.stimuliList);

      // get random stimulus out of selected stimuliType
      var  randomStimulus = tatoolExecutable.getRandomReplace(stimuli);
      return randomStimulus;
    };

    StroopExecutable.prototype.createRandomStimulus = function() {
      // get random stimulus out of selected stimuliType
      var  randomStimulus = tatoolExecutable.getRandom(this.stimuliList);
      return randomStimulus;
    };

    StroopExecutable.prototype.createNonRandomStimulus = function() {
      // get stimulus next replacement
      var nonRandomStimulus = tatoolExecutable.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    // Process given response and stop executable
    StroopExecutable.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      db.saveTrial(this.trial).then(tatoolExecutable.stop());
    };

    // Return our executable service object
    return StroopExecutable;

  }]);
