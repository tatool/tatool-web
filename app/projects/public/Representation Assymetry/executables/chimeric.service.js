tatool.factory('chimeric',['executableUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory', 'dbUtils',
  function (executableUtils, timerUtils, stimulusServiceFactory, inputServiceFactory, dbUtils) {

    var chimeric = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    chimeric.prototype.init = function() {
      var promise = executableUtils.createPromise();

      this.counter = 0;
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      //The stimuli list is a CSV explained in Tatool UI
      var self = this;
      executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
        function(list) {
          self.stimuliList = executableUtils.shuffle(list);
          self.setupInputKeys(list);
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      //Create a timer object in the Executable service init method
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.timer = timerUtils.createTimer(this.displayDuration, true, this);

      return promise;
    };

    // Adding keyInputs and show by default
    chimeric.prototype.setupInputKeys = function(list) {
      var keys = this.inputService.addInputKeys(list, !this.showKeys.propertyValue);

      if (keys.length === 0) {
        executableUtils.fail('Error creating input template for Executable chimeric. No keyCode provided in stimuliFile.');
      }
    };

    chimeric.prototype.createStimulus = function() {
      //Get the stimulus
      var stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      //Keep a record
      this.trial = {};
      this.trial.stimulusType = stimulus.stimulusType;
      this.trial.stimulusValue = stimulus.stimulusValue;

      //Show the image
      this.stimulusService.setImage(stimulus);
      this.counter++;

    };

    chimeric.prototype.processResponse = function(response) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = response;
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    chimeric.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return chimeric;
  }]);
