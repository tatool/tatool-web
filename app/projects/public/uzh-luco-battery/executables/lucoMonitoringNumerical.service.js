'use strict';

tatool
  .factory('lucoMonitoringNumerical', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory) {

    var lucoMonitoring = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    //  Initialze variables at the start of every session
    lucoMonitoring.prototype.init = function() {
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
        deferred.reject('Invalid property settings for Executable lucoMonitoringNumerical. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.mainGridService = gridServiceFactory.createService(3, 3, 'mainGrid', this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
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
        deferred.reject('Invalid property settings for Executable lucoMonitoringNumerical. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to randomisation property
    lucoMonitoring.prototype.processStimuliFile = function(list, deferred) {
      if (this.randomisation === 'full-condition') {
        this.stimuliList = this.splitStimuliList(list);
      } else if (this.randomisation === 'full') {
        this.stimuliList = executableUtils.shuffle(list);
      } else {
        this.stimuliList = list;
      }

      this.totalStimuli = list.length;
      this.setupInputKeys(list);
      deferred.resolve();
    };

    // Splitting the stimuliList according to stimulusType for full-condition and randomise
    lucoMonitoring.prototype.splitStimuliList = function(list) {
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
    lucoMonitoring.prototype.setupInputKeys = function(list) {
      var keys = this.inputService.addInputKeys(list, !this.showKeys.propertyValue);

      if (keys.length === 0) {
        executableUtils.fail('Error creating input template for Executable lucoMonitoringNumerical. No keyCode provided in stimuliFile.');
      }
    };

    // Create stimulus and set properties
    lucoMonitoring.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.responseGiven = false;

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

      // pick stimulus to display
      this.stimulus = null;
      if (this.randomisation === 'full-condition') {
        this.stimulus = this.createRandomConditionStimulus();
      } else if (this.randomisation === 'full') {
        this.stimulus = this.createRandomStimulus();
      } else {
        this.stimulus = this.createNonRandomStimulus();
      }

      if (this.stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable lucoMonitoringNumerical. No more stimuli available in current stimuliList.');
      } else {
        this.trial.stimulusValue = this.stimulus.stimulusValue;
        this.trial.stimulusType = this.stimulus.stimulusType;
        this.trial.correctResponse = this.stimulus.correctResponse;
      }
      // increment trial index counter
      this.counter++;
    };

    lucoMonitoring.prototype.setStimulus = function() {
      for (var i=1; i <= this.stimulus.stimulusCount; i++) {
        this.mainGridService.addCellAtPosition(this.stimulus['gridPosition' + i], {
          stimulusValue: this.stimulus['stimulusValue' + i], 
          stimulusValueType: this.stimulus['stimulusValueType' + i],
          gridCellClass: this.stimulus['gridCellClass' + i]
        });
      }
    };

    lucoMonitoring.prototype.createRandomConditionStimulus = function() {
      // get random stimuliType with replacement
      var stimuliType = executableUtils.getRandomReplace(this.stimuliList);

      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getRandomReplace(stimuliType);
      return randomStimulus;
    };

    lucoMonitoring.prototype.createRandomStimulus = function() {
      // get random stimulus out of selected stimuliType
      var  randomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return randomStimulus;
    };

    lucoMonitoring.prototype.createNonRandomStimulus = function() {
      // get stimulus next replacement
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    // Process given response and stop executable
    lucoMonitoring.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      console.log("processResponse");
    };

    // stop executable
    lucoMonitoring.prototype.endTask = function() {
      if (!this.responseGiven) {
        this.processResponse('absent');
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
      console.log("endTask");
    };

    return lucoMonitoring;

  }]);
