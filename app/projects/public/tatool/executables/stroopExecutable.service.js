'use strict';

/**
 * The Executable Service is responsible for the data preparation and storage.
 *
 * The Executable Service is only loaded once at the start of a session and therefore keeps its state. 
 * Make sure you reset variables if needed within a session.
 * 
 * Normally the Executable Service provides the following functionality to the Controller: 
 * 1. Stimulus data (what should be displayed in the Executable)
 * 2. Storage of data (e.g. item/trial information, responses, properties)
 */

tatool
  .factory('stroopExecutable', [ '$log', '$q', 'db', 'timerService', 'tatoolExecutable', 'tatoolStimulusService', 'tatoolInputService',
    function ($log, $q,  db, timerService, tatoolExecutable, tatoolStimulusService, tatoolInputService) {

    // Create a new executable service
    var StroopExecutable = tatoolExecutable.createExecutable();

    //  Initialze variables at the start of every session
    StroopExecutable.prototype.init = function() {
      var deferred = $q.defer();

      // template properties
      this.stimulus = tatoolStimulusService.createStimulus();
      this.input = tatoolInputService.createInput();

      // timing properties
      this.startTime = 0;
      this.endTime = 0;
      this.timerDuration = 2000;
      this.timer = timerService.createTimer(this.timerDuration, true, this);

      // load stimuli file from project or external resource
      this.dataPath = (this.dataPath) ? this.dataPath : '';
      var self = this;
      if (tatoolExecutable.isProjectResource(this.dataPath + this.stimuliFile)) {
        tatoolExecutable.getProjectCSV('stimuli', this.stimuliFile, true).then(function(list) {
          self.stimuliList = self.splitStimuliList(list);
          deferred.resolve();
        }, function(error) {
          deferred.reject('Resource not found: ' + self.stimuliFile);
        });
      } else {
        tatoolExecutable.getExternalCSV(this.dataPath + this.stimuliFile, true).then(function(list) {
          self.stimuliList = self.splitStimuliList(list);
          deferred.resolve();
        }, function(error) {
          deferred.reject('Resource not found: ' + self.stimuliFile);
        });
      }

      return deferred;
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

        // setup input keys for stimulus
        this.setupInputKeys(list[i]);
      }
      return newList;
    };

    // Adding keyInput
    StroopExecutable.prototype.setupInputKeys = function(stimulus) {
      var keyCodes = [];
      if (keyCodes.indexOf(stimulus.keyCode) === -1) {
        keyCodes.push(stimulus.keyCode);
        this.input.addInputKey(stimulus.keyCode, stimulus.correctResponse, null, true);
      }
    };

    // Generate a random stimulus and set properties
    StroopExecutable.prototype.createStimulus = function() {

      // pick random stimuliType
      var stimuli = tatoolExecutable.pickRandom(this.stimuliList);

      // pick random stimulus out of selected stimuliType
      var randomStimulus = tatoolExecutable.pickRandom(stimuli);

      // create new trial
      this.trial = {};
      this.trial.stimulusType = randomStimulus.stimulusType;
      this.trial.correctResponse = randomStimulus.correctResponse;
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      randomStimulus.stimulusClass = 'stroopStimulusSmall';

      // set stimulus data to our stimulus object
      this.stimulus.set(randomStimulus);
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
      db.saveTrial(this.trial).then(tatoolExecutable.stopExecutable());
    };

    // Return our executable service object
    return StroopExecutable;

  }]);
