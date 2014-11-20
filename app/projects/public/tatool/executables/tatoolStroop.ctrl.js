'use strict';

tatool
  .controller('tatoolStroopCtrl', [ '$scope', '$log', '$window', '$timeout', 'service',
    function ($scope, $log, $window, $timeout, service) {

    // Make the stimulus available for the <tatool-stimulus> template
    $scope.stimulus = service.stimulus;
    // Make the input available for the <tatool-input> template
    $scope.input = service.input;
    // Make the data path available for the <tatool-stimulus> template
    $scope.dataPath = service.dataPath;

    // Start execution
    $scope.start = function() {
      // Prepare stimulus
      service.createStimulus();

      // Enable input, start timer and display stimulus
      service.input.enable();
      service.timer.start(timerUp);
      service.startTime = service.stimulus.show();
    };

    // Called by our timer when the time is up and no user input was captured
    function timerUp() {
      service.input.disable();
      service.endTime = service.stimulus.hide();
      service.processResponse('');
    }

    // Captures user input
    $scope.inputAction = function(input, timing, event) {
      service.input.disable();
      service.timer.stop();
      service.stimulus.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
