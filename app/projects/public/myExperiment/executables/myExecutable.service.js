tatool.factory('myExecutable', [ 'tatoolExecutable', 'tatoolStimulusService', 'tatoolInputService', 'db',
  function (tatoolExecutable, tatoolStimulusService, tatoolInputService, db) {  
    
    var MyExecutable = tatoolExecutable.createExecutable();

    MyExecutable.prototype.init = function() {
      var promise = tatoolExecutable.createPromise();

      this.counter = 0;
      this.tatoolStimulus = tatoolStimulusService.createStimulus(this.stimuliPath);
      this.tatoolInput = tatoolInputService.createInput(this.stimuliPath);

      var self = this;
      tatoolExecutable.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
        function(list) {
          self.stimuliList = list;
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      return promise;
    };

    MyExecutable.prototype.createStimulus = function() {
      var stimulus = tatoolExecutable.getNext(this.stimuliList, this.counter);
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
      db.saveTrial(this.trial).then(tatoolExecutable.stop);
    };

    return MyExecutable;
  }]);