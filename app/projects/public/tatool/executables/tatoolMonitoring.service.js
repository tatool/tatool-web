'use strict';

tatool
  .factory('tatoolMonitoring', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory) {

    var Monitoring = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    var GRID_ROWS_DEFAULT = 3;
    var GRID_COLS_DEFAULT = 3;

    var CELL_HEIGHT_DEFAULT = 150;
    var CELL_WIDTH_DEFAULT = 150;

    //  Initialze variables at the start of every session
    Monitoring.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showKeys) {
        this.showKeys = { propertyValue: true };
      } else {
        this.showKeys.propertyValue = (this.showKeys.propertyValue === true) ? true : false;
      }
      
      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolMonitoring. Expected property <b>stimuliPath</b> of type Path.');
      }

      // grid properties
      this.gridRows = (this.gridRows ) ? this.gridRows : GRID_ROWS_DEFAULT;
      this.gridCols = (this.gridCols ) ? this.gridCols : GRID_COLS_DEFAULT;
      this.cellHeight = (this.cellHeight ) ? this.cellHeight : CELL_HEIGHT_DEFAULT;
      this.cellWidth = (this.cellWidth ) ? this.cellWidth : CELL_WIDTH_DEFAULT;

      // template properties
      this.mainGridService = gridServiceFactory.createService(this.gridRows, this.gridCols, 'mainGrid', this.stimuliPath, true);
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
        deferred.reject('Invalid property settings for Executable tatoolMonitoring. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to randomisation property
    Monitoring.prototype.processStimuliFile = function(list, deferred) {
      this.stimuliList = list;
      this.totalStimuli = list.length;
      this.setupInputKeys(list);
      deferred.resolve();
    };

    // Adding keyInputs and show by default
    Monitoring.prototype.setupInputKeys = function(list) {
      var keys = this.inputService.addInputKeys(list, !this.showKeys.propertyValue);

      if (keys.length === 0) {
        executableUtils.fail('Error creating input template for Executable tatoolMonitoring. No keyCode provided in stimuliFile.');
      }
    };

    // Create stimulus and set properties
    Monitoring.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.responseGiven = false;

      // reset counter to 0 if > no. of total stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      // create new trial
      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      // pick next stimulus to display
      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      if (this.stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable tatoolMonitoring. No more stimuli available in current stimuliList.');
      } else {
        this.trial.stimulusValue = this.stimulus.stimulusValue;
        this.trial.stimulusType = this.stimulus.stimulusType;
        this.trial.correctResponse = this.stimulus.correctResponse;
      }
      // increment trial index counter
      this.counter++;
    };

    Monitoring.prototype.setStimulus = function() {
      for (var i=1; i <= this.stimulus.stimulusCount; i++) {
        this.mainGridService.addCellAtPosition(this.stimulus['gridPosition' + i], {
          stimulusValue: this.stimulus['stimulusValue' + i], 
          stimulusValueType: this.stimulus['stimulusValueType' + i],
          gridCellClass: this.stimulus['gridCellClass' + i]
        });
      }
    };

    // Process given response and stop executable
    Monitoring.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      console.log(this.endTime);
      console.log(this.startTime);
      this.trial.givenResponse = givenResponse;
      
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
    };

    // stop executable
    Monitoring.prototype.endTask = function() {
      if (!this.responseGiven) {
        this.processResponse('absent');
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    return Monitoring;

  }]);
