tatool.factory('myExecutable', [ 'executableUtils', 'stimulusServiceFactory', 'inputServiceFactory', 'dbUtils',
  function (executableUtils, stimulusServiceFactory, inputServiceFactory, dbUtils) {  
    
    var MyExecutable = executableUtils.createExecutable();

    MyExecutable.prototype.init = function() {
      var promise = executableUtils.createPromise();

      this.counter = 0;
      this.tatoolStimulus = stimulusServiceFactory.createService(this.stimuliPath);
      this.tatoolInput = inputServiceFactory.createService(this.stimuliPath);

      var self = this;
      executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
        function(list) {
          self.stimuliList = list;
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      return promise;
    };

    MyExecutable.prototype.createStimulus = function() {
      var stimulus = executableUtils.getNext(this.stimuliList, this.counter);
      this.tatoolStimulus.set(stimulus);
      this.counter++;

      this.trial = {};
      this.trial.stimulusType = stimulus.stimulusType;
      this.trial.stimulusValue = stimulus.stimulusValue;
      this.trial.correctResponse = stimulus.correctResponse;
    };

    MyExecutable.prototype.processResponse = function(response) {
      this.trial.reactionTime = this.endTime - this.startTime; 
      this.trial.givenResponse = response;
      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }
      dbUtils.saveTrial(this.trial).then(executableUtils.stop);
    };

    return MyExecutable;
  }]);