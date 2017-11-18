'use strict';

tatool
  .controller('inhibitionGoNogoNewCtrl', [ '$scope', 'service',
    function ($scope, service) {

    // Make the stimulus service available for the <tatool-stimulus> directive
    //$scope.stimulusServiceLeft = service.stimulusServiceLeft;
    //$scope.stimulusServiceRight = service.stimulusServiceRight;
    $scope.stimulusServiceCenter = service.stimulusServiceCenter;
    // Make the input service available for the <tatool-input> directive
    $scope.inputService = service.inputService;

    // No cross to display. Change this
    //$scope.displayCross = false;

    // Start execution
    $scope.start = function() {
      service.createStimulus();
      displayCross();
    };

    // called to display cross
    function displayCross() {
      //$scope.displayCross = true;
      service.crossTimer.start(displayStimulus);
    }

    // called to display stimulus
    function displayStimulus() {
      service.inputService.enable();
      if (service.showKeys.propertyValue === true) {
        service.inputService.show();
      }
      if (service.timerEnabled.propertyValue === true) {
        service.timer.start(timerUp);
      }
      service.startTime = service.currentStimulusService.show();
    }

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.currentStimulusService.hide();
      service.processResponse('');
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.timer.stop();
      service.inputService.hide();
      service.currentStimulusService.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
