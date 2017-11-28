'use strict';

tatool
  .factory('tatoolLocalRecognition', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var LocalRecognition = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 900;
    var INTERVAL_DURATION_DEFAULT = 100;

    //  Initialze variables at the start of every session
    LocalRecognition.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showKeys) {
        this.showKeys = { propertyValue: true };
      } else {
        this.showKeys.propertyValue = (this.showKeys.propertyValue === true) ? true : false;
      }
      
      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolLocalRecognition. Expected property <b>stimuliPath</b> of type Path.');
      }

      // set grid size at task start 
      this.gridRows = 1;
      this.gridCols = 1;

      this.gridService = gridServiceFactory.createService(this.gridRows, this.gridCols, 'stimuliGrid', this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration ) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);
      this.timerIntervalProbe = timerUtils.createTimer(500, false, this);

      // trial counter property
      this.counter = 0;

      // prepare stimuli
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
        deferred.reject('Invalid property settings for Executable tatoolLocalRecognition. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // Create stimulus and set properties
    LocalRecognition.prototype.createStimulus = function() {
      this.memCounter = 0;
      this.probeCounter = 0;

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.gridService.clear().refresh();
      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);
      this.setupInputKeys(this.stimulus);
      this.counter++;
    };

    // Adding keyInputs and show by default
    LocalRecognition.prototype.setupInputKeys = function(stimulus) {
      this.inputService.removeAllInputKeys();
      stimulus.keyCount = (stimulus.keyCount) ? stimulus.keyCount : 2;
      for (var i = 1; i <= stimulus.keyCount; i++) {
        this.inputService.addInputKey(stimulus['keyCode' + i], stimulus['response' + i], stimulus['keyLabel' + i], stimulus['keyLabelType' + i], !this.showKeys.propertyValue);
      }
    };

    LocalRecognition.prototype.setStimulus = function() {
      if (this.gridRows != this.stimulus['gridRows'] || this.gridCols != this.stimulus['gridCols']) {
        this.gridRows = this.stimulus['gridRows'];
        this.gridCols = this.stimulus['gridCols'];
        this.gridService.resize(this.stimulus['gridRows'], this.stimulus['gridCols']).redraw();
      };

      this.gridService.addCellAtPosition(this.stimulus['stimulusGridPosition' + this.memCounter], {
        stimulusValue: this.stimulus['stimulusValue' + this.memCounter], 
        stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter],
        gridCellClass: 'memCell'
      });
    };

    LocalRecognition.prototype.setProbe = function() {
      this.startTime = 0;
      this.endTime = 0;

      this.gridService.addCellAtPosition(this.stimulus['probeGridPosition' + this.probeCounter], {
        stimulusValue: this.stimulus['probeValue' + this.probeCounter], 
        stimulusValueType: this.stimulus['probeValueType' + this.probeCounter],
        gridCellClass: 'probeCell' 
      });
    };

    LocalRecognition.prototype.getPhase = function() {
      return this.phase;
    };

    LocalRecognition.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response and stop executable
    LocalRecognition.prototype.processResponse = function(givenResponse) {
      this.trial = {};
      this.trial.trialNo = this.counter;
      this.trial.setSize = this.stimulus.stimulusCount;
      this.trial.correctResponse = (this.stimulus['probeType' + this.probeCounter] === 'match') ? 1 : 0;
      this.trial.probeType = this.stimulus['probeType' + this.probeCounter];
      this.trial.givenResponse = givenResponse;
      this.trial.stimulusValue = this.stimulus['probeValue' + this.probeCounter];
      this.trial.score = (givenResponse === this.trial.correctResponse) ? 1 : 0;
      this.trial.reactionTime = this.endTime - this.startTime;
      return dbUtils.saveTrial(this.trial);
    };

    LocalRecognition.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return LocalRecognition;

  }]);
