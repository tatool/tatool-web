'use strict';

tatool
  .factory('lucoListSwitching', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory) {

    var ListSwitching = executableUtils.createExecutable();

    var WARNING_DURATION_DEFAULT = 1000;      // warning before encoding
    var ENCODING_DURATION_DEFAULT = 2400;     // encoding of list
    var BLANK_DURATION_DEFAULT = 250;         // between lists in encoding phase
    var CUE_DURATION_DEFAULT = 150;           // cue 

    ListSwitching.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showKeys) {
        this.showKeys = { propertyValue: true };
      } else {
        this.showKeys.propertyValue = (this.showKeys.propertyValue === true) ? true : false;
      }

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolListSwitching. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridRows = 1;
      this.gridCols = 1;
      this.gridService = gridServiceFactory.createService(this.gridRows, this.gridCols, 'stimuliGrid', this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.warningDuration = (this.warningDuration ) ? this.warningDuration : WARNING_DURATION_DEFAULT;
      this.encodingDuration = (this.encodingDuration ) ? this.encodingDuration : ENCODING_DURATION_DEFAULT;
      this.blankDuration = (this.blankDuration ) ? this.blankDuration : BLANK_DURATION_DEFAULT;
      this.cueDuration = (this.cueDuration ) ? this.cueDuration : CUE_DURATION_DEFAULT;

      this.timerWarning = timerUtils.createTimer(this.warningDuration, true, this);
      this.timerEncoding = timerUtils.createTimer(this.encodingDuration, false, this);
      this.timerBlank = timerUtils.createTimer(this.blankDuration, false, this);
      this.timerCue = timerUtils.createTimer(this.cueDuration, false, this);

      this.counter = 0;

      this.phase = 1;

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
        deferred.reject('Invalid property settings for Executable tatoolListSwitching. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    ListSwitching.prototype.setStimulus = function() {

      if (this.gridRows != this.stimulus['gridRows'] || this.gridCols != this.stimulus['gridCols']) {
        this.gridRows = this.stimulus['gridRows'];
        this.gridCols = this.stimulus['gridCols'];
        this.gridService.resize(this.stimulus['gridRows'], this.stimulus['gridCols']).redraw();
      };

      for (var i = 1; i <= this.stimulus.stimulusCount; i++) {
        this.gridService.addCellAtPosition(this.stimulus['stimulusGridPosition' + i], {
          stimulusValue: this.stimulus['stimulusValue' + i], 
          stimulusValueType: this.stimulus['stimulusValueType' + i],
          gridCellClass: this.stimulus['gridCellClass' + i]
        });
      }

    };

    ListSwitching.prototype.setCue = function() {

      if (this.gridRows != this.stimulus['gridRows'] || this.gridCols != this.stimulus['gridCols']) {
        this.gridRows = this.stimulus['gridRows'];
        this.gridCols = this.stimulus['gridCols'];
        this.gridService.resize(this.stimulus['gridRows'], this.stimulus['gridCols']).redraw();
      };

      for (var i = 1; i <= this.stimulus.stimulusCount; i++) {
        this.gridService.addCellAtPosition(this.stimulus['stimulusGridPosition' + i], {
          stimulusValue: '', 
          stimulusValueType: 'text',
          gridCellClass: this.stimulus['gridCellClass' + i]
        });
      }

    };

    ListSwitching.prototype.createStimulus = function() {
      this.startTime = 0;
      this.endTime = 0;

      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      if (this.stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable tatoolListSwitching. No more stimuli available in current stimuliList.');
      } else {
        this.setupInputKeys(this.stimulus);
        this.phase = this.stimulus.phase;
        this.trial.stimulusValue = this.stimulus.stimulusValue1 + "" + this.stimulus.stimulusValue2;
        this.trial.correctResponse = this.stimulus.correctResponse;
        this.trial.listType = this.stimulus.listType;
        this.trial.probeType = this.stimulus.probeType;
        this.trial.listSwitch = this.stimulus.listSwitch;
        this.trial.objectSwitch = this.stimulus.objectSwitch;
        this.trial.run = this.stimulus.run;
        this.trial.trial = this.stimulus.trial;
      }

      this.counter++;
    };

    ListSwitching.prototype.setupInputKeys = function(stimulus) {
      this.inputService.removeAllInputKeys();
      stimulus.keyCount = (stimulus.keyCount) ? stimulus.keyCount : 2;
      for (var i = 1; i <= stimulus.keyCount; i++) {
        this.inputService.addInputKey(stimulus['keyCode' + i], stimulus['response' + i], stimulus['keyLabel' + i], stimulus['keyLabelType' + i], !this.showKeys.propertyValue);
      }
    };

    ListSwitching.prototype.getPhase = function() {
      return this.phase;
    };

    ListSwitching.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    ListSwitching.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    return ListSwitching;

  }]);
