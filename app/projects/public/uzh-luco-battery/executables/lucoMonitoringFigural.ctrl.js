'use strict';

tatool
  .controller('lucoMonitoringFiguralCtrl', [ '$scope', 'service',
    function ($scope, service) {

    // Make the stimulus service available for the <tatool-stimulus> directive
    $scope.stimulusService = service.stimulusService;
    // Make the input service available for the <tatool-input> directive
    $scope.inputService = service.inputService;

    // Start execution
    $scope.start = function() {
      service.createStimulus();

      service.inputService.enable();

      if (service.showKeys.propertyValue === true) {
        service.inputService.show();
      }
      if (service.timerEnabled.propertyValue === true) {
        service.timer.start(timerUp);
      }
      service.startTime = service.stimulusService.show();
    };

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.startTime;
      service.endTask();
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.inputService.hide();
      service.endTime = timing;
      service.responseGiven = true;
      service.processResponse(input.givenResponse);
    };

  }]);
