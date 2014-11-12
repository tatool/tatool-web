'use strict';

/**
 * The Executable Controller is responsible for the communication between the user interface 
 * (directives), and the data (service).
 *
 * The Controller is reloaded everytime the Executable is run therefore it can't keep any state. That's what our service is for!
 * 
 * All variables that you want to use in your template should be assigned to properties of the $scope object. 
 * This makes sure they are accessible from your template html and will update the user interface automatically whenever the value changes.
 */

tatool
  .controller('stroopExecutableCtrl', [ '$scope', '$log', '$window', '$timeout', 'service',
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
