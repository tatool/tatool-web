tatool.controller('chimericCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.stimulusServiceUp = service.stimulusServiceUp;
    $scope.stimulusServiceDown = service.stimulusServiceDown;
    $scope.inputService = service.inputService;

    $scope.start = function() {
      service.createStimulus();

      service.inputService.show();
      service.inputService.enable();

      //Start the visual timer
      service.timer.start(timerUp);

      //Start the real timing
      service.stimulusServiceUp.show();
      service.startTime = service.stimulusServiceDown.show();

    };

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.stimulusServiceUp.hide();
      service.stimulusServiceDown.hide();
      service.processResponse('');
    }

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.stimulusServiceUp.hide();
      service.stimulusServiceDown.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
