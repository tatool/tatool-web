tatool.factory('myExecutable', [ 'tatoolExecutable',
  function (tatoolExecutable) {  
    
    var MyExecutable = tatoolExecutable.createExecutable();

    MyExecutable.prototype.init = function() {
      var promise = tatoolExecutable.createPromise();

      // define resource for stimuliFile
      var stimuliFile = {
        project: {
          name: 'myExperiment',
          access: 'public'
        },
        resourceType: 'stimuli',
        resourceName: 'flanker-arrows.csv'
      };

      // define resource for stimuliPath
      var stimuliPath = {
        project: {
          name: 'myExperiment',
          access: 'public'
        },
        resourceType: 'stimuli'
      };

      // read the stimuliFile and all image stimuli
      // resolve promise when reading successful and reject when an error occurred
      tatoolExecutable.getCSVResource(stimuliFile, true, stimuliPath).then(
        function(list) {
          this.stimuliList = list;
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      return promise;
    };

    // our custom methods go here
    MyExecutable.prototype.stopExecution = function() {
      tatoolExecutable.stop();
    };

    return MyExecutable;
  }]);