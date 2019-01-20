'use strict';

tatool
  .factory('DualNBack', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {

    var DualNBack = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;
    var N_VALUE = 1;
    var ITERATIONS = 20;
    var TARGETS = 12;

    //  Initialze variables at the start of every session
    DualNBack.prototype.init = function() {
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
        deferred.reject('Invalid property settings for Executable DualNBack. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.nValue = (this.nValue ) ? this.nValue : N_VALUE;
      this.iterations = (this.iterations ) ? this.iterations : ITERATIONS;
      this.targets = (this.targets ) ? this.targets : TARGETS;
      this.timer = timerUtils.createTimer(this.displayDuration, true, this);

      // trial counter property
      this.counter = 0;
      this.nCounter = 0;
      this.previousn = [];

      // prepare stimuli
      if (this.stimuliFile) 
      {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) 
        {
            self.processStimuliFile(list, deferred);
          }, function(error) 
          {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } 
      else 
      {
        deferred.reject('Invalid property settings for Executable DualNBack. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // process stimuli file according to randomisation property
    DualNBack.prototype.processStimuliFile = function(list, deferred) {

      this.stimuliList = this.makeTargets(list);

      this.totalStimuli = this.stimuliList.length;
      this.setupInputKeys(list);
      deferred.resolve();
    };

    DualNBack.prototype.countTargets = function(list)
    {
      var targets = 0;

      for (var i = this.nValue ; i < list.length ; i++) 
      {
        if(list[i].stimulusType == list[i - this.nValue].stimulusType)
        {
          targets++;
        }
        else if((list[i].stimulusType & 0xF0) == (list[i - this.nValue].stimulusType & 0xF0))
        {
          targets++;
        }
        else if((list[i].stimulusType & 0x0F) == (list[i - this.nValue].stimulusType & 0x0F))
        {
          targets++;
        }
      }
      return targets;
    }

    DualNBack.prototype.makeTargets = function(list)
    {
      var newList = (executableUtils.shuffle(list)).slice(0,this.iterations);

      while(this.countTargets(newList) < this.targets)
      {
        var targets = 0;
        var nonTargetIndices = [];
        for (var i = this.nValue ; i < newList.length ; i++) 
        {
          if(newList[i].stimulusType == newList[i - this.nValue].stimulusType)
          {
            targets++;
          }
          else if((newList[i].stimulusType & 0xF0) == (newList[i - this.nValue].stimulusType & 0xF0))
          {
            targets++;
          }
          else if((newList[i].stimulusType & 0x0F) == (newList[i - this.nValue].stimulusType & 0x0F))
          {
            targets++;
          }
          else
          {
            nonTargetIndices.push(i);
          }
        }

        nonTargetIndices = executableUtils.shuffle(nonTargetIndices);

        while(targets < this.targets)
        {
          var replace = nonTargetIndices.pop();
          var rand = Math.random();
          newList[replace] = newList[replace - this.nValue];
          if(rand < 0.33)
          {
            rand = Math.floor(Math.random() * 9) + 1;
            var temp = newList[replace].stimulusType;
            temp &= 0xF0;
            temp |= rand;
            newList[replace] = this.findStimulus(list, temp);
          }
          else if(rand < 0.67)
          {
            rand = (Math.floor(Math.random() * 8) + 1) << 4;
            var temp = newList[replace].stimulusType;
            temp &= 0x0F;
            temp |= rand;
            newList[replace] = this.findStimulus(list, temp);
          }
          targets++;
        }  
      }
      return newList;
    }

    DualNBack.prototype.findStimulus = function(list, type) 
    {
      for (var i = 0 ; i < list.length ; i++) 
      {
        if(list[i].stimulusType == type)
          return list[i];
      }
      return null;
    }

    // Adding keyInputs and show by default
    DualNBack.prototype.setupInputKeys = function(list) {

      var key0 = {};
      key0.keyCode = "ArrowUp";
      key0.keyIndex = "0";
      key0.response = "none";

      var key1 = {};
      key1.keyCode = "ArrowLeft";
      key1.keyIndex = "1";
      key1.response = "image";

      var key2 = {};
      key2.keyCode = "ArrowRight";
      key2.keyIndex = "2";
      key2.response = "audio";

      var key3 = {};
      key3.keyCode = "ArrowDown";
      key3.keyIndex = "3";
      key3.response = "both";

      var keys = [key0, key1, key2, key3]
      
      this.inputService.addInputKeys(keys, !this.showKeys.propertyValue);
    };

    // Create stimulus and set properties
    DualNBack.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;

      // reset counter to 0 if > no. of total stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      // create new trial
      this.trial = {};
      this.trial.givenResponse = null;
      this.trial.reactionTime = 0;
      this.trial.score = null;

      // pick stimulus to display

      var stimulus = this.createNonRandomStimulus();
      
      if (stimulus === null) {
        executableUtils.fail('Error creating stimulus in Executable DualNBack. No more stimuli available in current stimuliList.');
      } else {
        this.previousn[this.nCounter] = stimulus.stimulusType;
        this.trial.stimulusValue = stimulus.stimulusValue;
        this.trial.stimulusType = stimulus.stimulusType;
        this.trial.correctResponse = stimulus.correctResponse;
        this.stimulusService.set(stimulus);
      }

      // increment trial index counter
      this.counter++;
    };

    DualNBack.prototype.createNonRandomStimulus = function() {
      // get stimulus next replacement
      var nonRandomStimulus = executableUtils.getNext(this.stimuliList, this.counter);
      return nonRandomStimulus;
    };

    // Process given response and stop executable
    DualNBack.prototype.processResponse = function(givenResponse) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      var expected = "";

      if(this.nCounter >= this.nValue)
      {
        if(this.previousn[this.nCounter - this.nValue] == this.trial.stimulusType)
        {
          expected = "both";
        }
        // upper nibble is audio
        else if((this.previousn[this.nCounter - this.nValue] & 0xF0) == (this.trial.stimulusType & 0xF0))
        {
          expected = "audio";
        }
        // lower nibble is position
        else if((this.previousn[this.nCounter - this.nValue] & 0x0F) == (this.trial.stimulusType & 0x0F))
        {
          expected = "image";
        }
      }

      this.nCounter++;

      if (expected == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    return DualNBack;

  }]);
