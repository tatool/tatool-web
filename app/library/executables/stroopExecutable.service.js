'use strict';

/**
 * The Stroop Executable Service is responsible for the backend (data, stimuli).
 *
 * The Executable Service is only loaded once at the startup of Tatool and therefore keeps its state. 
 * Make sure you reset variables if needed.
 * 
 * Normally the Executable Service provides the following functionality to the Controller: 
 * 1. Stimulus data (what should be displayed in the Executable)
 * 2. Storage of data (e.g. item/trial information, responses, properties)
 */

tatool
  .factory('stroopExecutable', [ '$log', 'db', 'timerService', 'tatoolPhase', 'tatoolExecutable',
    function ($log, db, timerService, tatoolPhase, tatoolExecutable) {

    // Define our executable service constructor which will be called once for every instance
    var StroopExecutable = tatoolExecutable.createExecutable();

    //  Initialze variables at the start of every session
    StroopExecutable.prototype.init = function() {
      this.stimulusText = '';
      this.styleIsGreen = true;
      this.startTime = 0;
      this.endTime = 0;
      this.timerDuration = 2000;
      this.trial = {};

      this.trial.correctResponse = null;
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      this.timer = timerService.createTimer(this.timerDuration, true, this);
    };

    // Generate a random stimulus and set properties
    StroopExecutable.prototype.createStimulus = function() {
      if (Math.random() <= 0.5) {
        this.styleIsGreen = true;
      } else {
        this.styleIsGreen = false; 
      }

      if (Math.random() <= 0.5) {
        this.stimulusText = 'blue';
      } else {
        this.stimulusText = 'green';
      }

      if (this.styleIsGreen) {
        this.trial.correctResponse = 'green';
      } else {
        this.trial.correctResponse = 'blue';
      }
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

      // a) if you want to set module properties
      //    Generally you will not need to save the module to the database yourself as this happens automatically at the end of a session.
      //    You will still have access to the module properties through db.getModuleProperty('reactionTime')
      //db.setModuleProperty(this, 'reactionTime', trial.reactionTime);
      //db.saveModule().then(executor.stopExecutable());

      // b) if you want to save the trial to the db and stop the executable.
      db.saveTrial(this.trial).then(tatoolExecutable.stopExecutable());

      // c) if you want to stop the execution of this executable without saving anything
      //executor.stopExecutable()

    };

    // Return our executable service object
    return StroopExecutable;

  }]);
