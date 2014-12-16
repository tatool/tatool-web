'use strict';

tatool
  .factory('tatoolStroop', [ '$log', '$q', 'dbUtils', 'timerService', 'executableUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function ($log, $q,  dbUtils, timerService, executableUtils, stimulusServiceFactory, inputServiceFactory) {

    // Create a new executable service
    var StroopExecutable = executableUtils.createExecutable();

    //  Initialze variables at the start of every session
    StroopExecutable.prototype.init = function() {
      var deferred = $q.defer();

      if (!this.hideKeys) {
        this.hideKeys = { propertyValue: false };
      } else {
        this.hideKeys = (this.hideKeys.propertyValue === true) ? true : false;
      }

      if (!this.timerEnabled) {
        this.timerEnabled = { propertyValue: false };
      } else {
        this.timerEnabled = (this.timerEnabled.propertyValue === true) ? true : false;
      }
      
      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolStroop. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.tatoolStimulus = stimulusServiceFactory.createService(this.stimuliPath);
      this.tatoolInput = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.timerDuration = (this.timerDuration ) ? this.timerDuration : 2000;
      this.timer = timerService.createTimer(this.timerDuration, true, this);

      // trial counter property
      this.counter = -1;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.processStimuliFile(list, deferred);
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolStroop. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to random property
    StroopExecutable.prototype.processStimuliFile = function(list, deferred) {
      if (this.random === 'full-condition') {
        this.stimuliList = this.splitStimuliList(list);
      } else if (this.random === 'full') {
        this.stimuliList = executableUtils.shuffle(list);
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
          this.tatoolInput.addInputKey(list[i].keyCode, list[i].correctResponse, list[i].keyLabel, list[i].keyLabelType, this.hideKeys);
        }
      }
      if (keyCodes.length === 0) {
        executableUtils.fail('Error creating tatoolInput in Executable tatoolStroop. No keyCodes provided in stimuliFile.');
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
        executableUtils.fail('Error creating stimulus in Executable tatoolStroop. No more stimuli available in current stimuliList.');
      } else {
        this.trial.stimulusType = stimulus.stimulusType;
        this.trial.correctResponse = stimulus.correctResponse;
        this.tatoolStimulus.set(stimulus);
      }
    };

    StroopExecutable.prototype.createRandomConditionStimulus = function() {
      // get random stimuliType with replacement
      var stimuli = executableUtils.getRandomReplace(this.stimuliList);

      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getRandomReplace(stimuli);
      return randomStimulus;
    };

    StroopExecutable.prototype.createRandomStimulus = function() {
      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getRandom(this.stimuliList);
      return randomStimulus;
    };

    StroopExecutable.prototype.createNonRandomStimulus = function() {
      // get stimulus next replacement
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
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
      dbUtils.saveTrial(this.trial).then(executableUtils.stop());
    };

    // Return our executable service object
    return StroopExecutable;

  }]);
