tatool.controller('myExecutableCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.stimulus = service.tatoolStimulus;
    $scope.input = service.tatoolInput;
    
    $scope.start = function() {
      service.createStimulus();

      service.startTime = service.tatoolInput.show();
      service.tatoolInput.enable();

      service.tatoolStimulus.show();
    };

    $scope.inputAction = function(input, timing, event) {
      service.tatoolInput.disable();
      service.tatoolStimulus.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);