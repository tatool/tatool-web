tatool.factory('snarcweek',['executableUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory', 'dbUtils',
  function (executableUtils, timerUtils, stimulusServiceFactory, inputServiceFactory, dbUtils) {

    var SNARCweek = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    SNARCweek.prototype.init = function() {
      var promise = executableUtils.createPromise();

      this.counter = 0;
      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      //The stimuli list is a CSV explained in Tatool UI
      var self = this;
      executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
        function(list) {
          self.stimuliList = executableUtils.shuffle(list);
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      //Create a timer object in the Executable service init method
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.timer = timerUtils.createTimer(this.displayDuration, true, this);


      //Create an array of the names of the days of the week
      this.days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

      //Full date
      this.d = new Date();

      //Day of the week (in number) of today
      this.today = this.d.getDay();

      return promise;
    };

    SNARCweek.prototype.createStimulus = function() {
      //Get the stimulus
      var stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      console.log(stimulus);

      //Stimulus is relative to today
      daynum = (this.today + stimulus.stimulusValue);
      //Days of the week only between 0 and 6
      if (daynum<0) {
          daynum += 7;
      } else if (daynum>6) {
          daynum -=7;
      }

      //Keep a record
      this.trial = {};
      this.trial.today = this.today;
      this.trial.stimulusType = stimulus.stimulusType;
      this.trial.stimulusValue = daynum;
      this.trial.stimulusDistance = stimulus.stimulusValue;
      this.trial.correctResponse = stimulus.correctResponse;

      //Show a day in name (ex: "Wednesday") instead of a number (3)
      stimulus.stimulusValue = this.days[daynum];

      this.stimulusService.setText(stimulus);
      this.counter++;

    };

    SNARCweek.prototype.processResponse = function(response) {
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = response;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    SNARCweek.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return SNARCweek;
  }]);
