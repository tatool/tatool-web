'use strict';

tatool
  .factory('tatoolCorsiBlock', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var CorsiBlock = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 1000;
    var INTERVAL_DURATION_DEFAULT = 400;
    var RECALL_ANIMATION_DURATION_DEFAULT = 150;

    //  Initialze variables at the start of every session
    CorsiBlock.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      // template properties
      this.mainGridService = gridServiceFactory.createService(3, 3, 'mainGrid', this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration ) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.recallAnimationDuration = (this.recallAnimationDuration ) ? this.recallAnimationDuration : RECALL_ANIMATION_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);
      this.timerRecallAnimation = timerUtils.createTimer(this.recallAnimationDuration, false, this);

      // trial counter property
      this.counter = 0;

      // disable input by default
      this.enableInput = false;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.stimuliList = list;
            self.totalStimuli = list.length;
            if (self.randomisation === 'full') {
              self.stimuliList = executableUtils.shuffle(self.stimuliList);
            }
            deferred.resolve();
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolCorsiBlock. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // Create stimulus and set properties
    CorsiBlock.prototype.createStimulus = function() {
      this.startTime = 0;
      this.endTime = 0;
      this.memCounter = 0;
      this.recallCounter = 0;
      this.recallPositions = [];

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
        if (this.randomisation === 'full') {
          this.stimuliList = executableUtils.shuffle(this.stimuliList);
        }
      }

      this.mainGridService.clear().refresh();
      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    CorsiBlock.prototype.setStimulus = function() {
      this.mainGridService.addCellAtPosition(this.stimulus['gridPosition' + this.memCounter], {
        stimulusValue: this.stimulus['stimulusValue' + this.memCounter], 
        stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter],
        gridCellClass: this.stimulus['gridCellClass' + this.memCounter]
      });
    };

    CorsiBlock.prototype.setRecallStimulus = function() {
      for (var i=1; i <= 9; i++) {
        this.mainGridService.addCellAtPosition(i, {
          stimulusValue: '', 
          stimulusValueType: 'text',
          gridCellClass: 'tatoolCorsiBlock_recallCell'
        });
      }

      this.mainGridService.refresh();
    };

    CorsiBlock.prototype.getPhase = function() {
      return this.phase;
    };

    CorsiBlock.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response and save item
    CorsiBlock.prototype.processResponse = function(cell) {
      this.trial = {};
      this.trial.trialNo = this.counter;
      this.trial.setSize = this.stimulus.stimulusCount;
      this.trial.itemNo = this.recallCounter;
      this.trial.correctResponse = this.stimulus['gridPosition' + this.recallCounter];
      this.trial.givenResponse = cell.gridPosition;
      this.trial.stimulusValue = cell.data.stimulusValue;
      this.trial.score = (this.trial.correctResponse === this.trial.givenResponse) ? 1 : 0;
      return dbUtils.saveTrial(this.trial);
    };

    CorsiBlock.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return CorsiBlock;

  }]);
