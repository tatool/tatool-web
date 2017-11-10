'use strict';

tatool
  .factory('tatoolShifting', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {

    var Shifting = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;
    var DISPLAY_CUE_DURATION_DEFAULT = 250;

    //  Initialze variables at the start of every session
    Shifting.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showKeys) {
        this.showKeys = { propertyValue: true };
      } else {
        this.showKeys.propertyValue = (this.showKeys.propertyValue === true) ? true : false;
      }

      if (!this.timerEnabled) {
        this.timerEnabled = { propertyValue: false };
      } else {
        this.timerEnabled.propertyValue = (this.timerEnabled.propertyValue === true) ? true : false;
      }
      
      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolShifting. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.cueService = stimulusServiceFactory.createService(this.stimuliPath);
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.displayCueDuration = (this.displayCueDuration ) ? this.displayCueDuration : DISPLAY_CUE_DURATION_DEFAULT;
      this.cueTimer = timerUtils.createTimer(this.displayCueDuration, false, this);
      this.timer = timerUtils.createTimer(this.displayDuration, true, this);

      // trial counter property
      this.counter = 0;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.processStimuliFile(list, deferred);
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolShifting. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to randomisation property
    Shifting.prototype.processStimuliFile = function(list, deferred) {
      if (this.randomisation === 'full-condition') {
        this.stimuliList = this.splitStimuliList(list);
      } else if (this.randomisation === 'full') {
        this.stimuliList = executableUtils.shuffle(list);
      } else {
        this.stimuliList = list;
      }

      this.totalStimuli = list.length;
      deferred.resolve();
    };

    // Splitting the stimuliList according to stimulusType for full-condition and randomise
    Shifting.prototype.splitStimuliList = function(list) {
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

    // Adding keyInputs and show by default
    Shifting.prototype.setupInputKeys = function(stimulus) {
      this.inputService.removeAllInputKeys();
      stimulus.keyCount = (stimulus.keyCount) ? stimulus.keyCount : 2;
      for (var i = 1; i <= stimulus.keyCount; i++) {
        this.inputService.addInputKey(stimulus['keyCode' + i], stimulus['response' + i], stimulus['keyLabel' + i], stimulus['keyLabelType' + i], !this.showKeys.propertyValue);
      }
    };

    // Create stimulus and set properties
    Shifting.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;

      // reset counter to 0 if > no. of total stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
        if (this.randomisation === 'full') {
          this.stimuliList = executableUtils.shuffle(this.stimuliList);
        }
      }

      // create new trial
      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      // pick stimulus to display and set shiftingType from stimulus file or dynamically
      var stimulus = null;
      if (this.randomisation === 'full-condition') {
        stimulus = this.createRandomConditionStimulus();
        this.trial.shiftingType = (!this.lastStimulus) ? 'start' : (stimulus.stimulusType === this.lastStimulus.stimulusType) ? 'repetition' : 'switch';
      } else if (this.randomisation === 'full') {
        stimulus = this.createRandomStimulus();
        this.trial.shiftingType = (!this.lastStimulus) ? 'start' : (stimulus.stimulusType === this.lastStimulus.stimulusType) ? 'repetition' : 'switch';
      } else {
        stimulus = this.createNonRandomStimulus();
        this.trial.shiftingType = stimulus.shiftingType;
      }

      if (stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable tatoolShifting. No more stimuli available in current stimuliList.');
      } else {
        this.trial.stimulusValue = stimulus.stimulusValue;
        this.trial.stimulusType = stimulus.stimulusType;
        this.trial.correctResponse = stimulus.correctResponse;

        var cue = {stimulusValue: stimulus.cueValue, stimulusValueType: stimulus.cueValueType, stimulusValueColor: stimulus.cueValueColor };
        this.cueService.set(cue);
        this.stimulusService.set(stimulus);
        this.setupInputKeys(stimulus);

        this.lastStimulus = stimulus;
      }

      // increment trial index counter
      this.counter++;
    };

    Shifting.prototype.createRandomConditionStimulus = function() {
      // get random stimuliType with replacement
      var stimuliType = executableUtils.getRandomReplace(this.stimuliList);

      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getRandomReplace(stimuliType);
      return randomStimulus;
    };

    Shifting.prototype.createRandomStimulus = function() {
      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return randomStimulus;
    };

    Shifting.prototype.createNonRandomStimulus = function() {
      // get stimulus next replacement
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    // Process given response and stop executable
    Shifting.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    return Shifting;

  }]);
