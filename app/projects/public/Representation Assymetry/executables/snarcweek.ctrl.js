tatool.controller('snarcweekCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;

    $scope.start = function() {
      service.createStimulus();

      service.inputService.show();
      service.inputService.enable();

      //Start the visual timer
      service.timer.start(timerUp);

      //Start the real timing
      service.startTime = service.stimulusService.show();

    };

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.stimulusService.hide();
      service.processResponse('');
    }

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.stimulusService.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
