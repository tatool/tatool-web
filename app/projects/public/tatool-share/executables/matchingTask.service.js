'use strict';

tatool
  .factory('matchingTask', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {  

    var MatchingTaskExecutable = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 200;
	var MASK_DURATION_DEFAULT = 200;
	var FIXATION_DURATION_DEFAULT = 800;
	var BLANK_DURATION_DEFAULT = 1000;
    var INTERVAL_DURATION_DEFAULT = 0;
    var ANSWER_TEXT_DEFAULT = 'Same or Different';
	var MIN_NO_TRIALS = 200;
	var NO_TRIALS_REQUIRED = 300;

	// Initialization
    MatchingTaskExecutable.prototype.init = function() {
      var promise = executableUtils.createPromise();

      this.phase = 'INIT';

      if (!this.suspendAfterEachItem) {
        this.suspendAfterEachItem = { propertyValue: true };
      }

      if (!this.stimuliPath) {
        promise.reject('Invalid property settings for Executable matchingTask. Expected property <b>stimuliPath</b> of type Path.');
      }

      if (!this.timerEnabled) {
        this.timerEnabled = { propertyValue: true };
      } else {
        this.timerEnabled.propertyValue = (this.timerEnabled.propertyValue === true) ? true : false;
      }

      // template properties
      this.answerText = (this.answerText ) ? this.answerText : ANSWER_TEXT_DEFAULT;
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService();

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
	  this.maskDuration = (this.maskDuration ) ? this.maskDuration : MASK_DURATION_DEFAULT;
	  this.fixationDuration = (this.fixationDuration ) ? this.fixationDuration : FIXATION_DURATION_DEFAULT;
	  this.blankDuration = (this.blankDuration ) ? this.blankDuration : BLANK_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration ) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.timerDisplayStimulus = timerUtils.createTimer(this.displayDuration, true, this);
	  this.timerMaskStimulus = timerUtils.createTimer(this.maskDuration, true, this);
	  this.timerFixationStimulus = timerUtils.createTimer(this.fixationDuration, true, this);
	  this.timerBlankStimulus = timerUtils.createTimer(this.blankDuration, true, this);
      this.timerIntervalStimulus = timerUtils.createTimer(this.intervalDuration, false, this);
	  
	  // trial counter property	
	  this.counter = 0;
	  this.totalScore = 0;
	  this.accuracy = 0;
	
	  // get the sessionCode to a Session Property with the name currentLevel of this Executable
      // prepare stimuliFile
		 if (this.stimuliFile) {
			 var self = this;
			 executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
			 function(list) {
				 self.processStimuliFile(list, promise);
				 promise.resolve();
			}, function(error) {
				promise.reject('Resource not found: ' + self.stimuliFile.resourceName);
			});
		} else {
			promise.reject('Invalid property settings for Executable matchingTask. Expected property <b>stimuliFile</b> of type Resource.');
		} 
      
      return promise;
    };

	// Allow to stop after a minimum number of trials
	MatchingTaskExecutable.prototype.handleEnd_min = function() {
		var notrial = dbUtils.getTrialNr();
		if (notrial > MIN_NO_TRIALS) {
			console.log('Quit after ', notrial, ' by participant');
			executableUtils.stopModule(1);
		}
	};
	
	// Stop after the maximum number of trials is reached
	MatchingTaskExecutable.prototype.handleEnd_max = function() {
		var notrial = this.counter;
		console.log(notrial, ' trials');
		if (notrial === NO_TRIALS_REQUIRED) {
			console.log('Stop after ',notrial, ' trials');
			executableUtils.stopModule(1);
		}
	};
	
    // process stimuli file according to random property
    MatchingTaskExecutable.prototype.processStimuliFile = function(list, promise) {
      if (this.randomisation === 'full') {
        this.stimuliList = executableUtils.shuffle(list);
      } else {
        this.stimuliList = list;
      }
      this.totalStimuli = list.length;
      promise.resolve();
    };

    // Create stimulus and set properties
    MatchingTaskExecutable.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.digits = [];
      this.matchCounter = 0;
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
        executableUtils.fail('Error creating stimulus in Executable matchingTask. No more stimuli available in current stimuliList.');
      } else {
        this.stimulus = stimulus;
      }

      // increment stimulus index counter
      this.counter++;
    };

    MatchingTaskExecutable.prototype.createRandomStimulus = function() {
      // get next ranom stimulus
      var  randomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return randomStimulus;
    };

    MatchingTaskExecutable.prototype.createNonRandomStimulus = function() {
      // get next stimulus
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };
 
    MatchingTaskExecutable.prototype.setStimulus = function() {
      this.stimulusService.set({ stimulusValueType: this.stimulus['stimulusValueType' + this.matchCounter], stimulusValue: this.stimulus['stimulusValue' + this.matchCounter] });
    };

    MatchingTaskExecutable.prototype.setAnswerStimulus = function(text) {
      this.stimulusService.setText({ stimulusValue: text });
    };

    MatchingTaskExecutable.prototype.getPhase = function() {
      return this.phase;
    };

    MatchingTaskExecutable.prototype.setPhase = function(phase) {
      this.phase = phase;
    };
	
    // Process given response and stop executable
    MatchingTaskExecutable.prototype.addTrial = function(givenResponse) {
	  dbUtils.setModuleProperty(this, 'trialNumber', this.counter);
	  //dbUtils.setModuleProperty(this, 'stimType', this.counter);
	  	  
	  this.trial = {};
	  		
      this.trial.trialNo = this.counter;
	  this.trial.stim1 = this.stimulus.stimulusValue3;
	  this.trial.stim2 = this.stimulus.stimulusValue6;
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      this.trial.correctResponse = this.stimulus.correctResponse;

      if (this.trial.correctResponse.toString().toLowerCase() == this.trial.givenResponse.toLowerCase()) {
        this.trial.score = 1;
		this.totalScore++;
		this.accuracy = this.totalScore*100/this.counter;
		dbUtils.setModuleProperty(this, 'accuracy', this.accuracy);
		dbUtils.setModuleProperty(this, 'totalScore', this.totalScore);
      } else {
        this.trial.score = 0;
		this.accuracy = this.totalScore*100/this.counter;
		dbUtils.setModuleProperty(this, 'accuracy', this.accuracy);
		dbUtils.setModuleProperty(this, 'totalScore', this.totalScore);
      }

      return dbUtils.saveTrial(this.trial);
    };

    MatchingTaskExecutable.prototype.stopExecution = function() {
		executableUtils.stop();
    };

    MatchingTaskExecutable.prototype.suspendExecution = function() {
      executableUtils.suspend();
    };

    return MatchingTaskExecutable;

  }]);
