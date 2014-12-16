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
  .factory('dbRegression', [ '$log', 'executableUtils', 'dbUtils', 'timerService', 'tatoolPhase',
    function ($log, executableUtils, dbUtils, timerService, tatoolPhase) {

    // Create our executable
    var DbRegression = executableUtils.createExecutable();

    // Initialize all properties at session start (executable/trial properties)
    DbRegression.prototype.init = function() {
      $log.debug('Initialize Executable with name: ' + this.name);
      this.stimulusText = '';
      this.styleIsGreen = true;
      this.startTime = 0;
      this.endTime = 0;
      this.timerDuration = 10;
      this.trial = {};

      this.trial.correctResponse = null;
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      this.timer = timerService.createTimer(this.timerDuration, true, this);
    };

    // Generate a random stimulus and set properties
    DbRegression.prototype.createStimulus = function() {
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
    DbRegression.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }

      dbUtils.setSessionProperty(this, 'anotherProperty', '666');
      dbUtils.setSessionProperty(this, 'myProperty', 'myValueShouldBeCorrectNow');
      dbUtils.setSessionProperty(this, 'wtf', 'test');
      dbUtils.setModuleProperty(this, 'module1', 2);
      dbUtils.setModuleProperty(this, 'module2', 456431);
      
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    // Return our executable service object
    return DbRegression;

  }]);
