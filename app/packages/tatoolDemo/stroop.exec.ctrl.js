'use strict';

/**
 * The Stroop Executable Controller is responsible to communicate between the user interface 
 * (user input, display), and the backend (data, stimuli, trial).
 *
 * The Controller is reloaded everytime the Executable is run therefore it can't keep any state.
 * 
 * All variables that you want to use in your template should be defined as properties of the $scope object. 
 * This makes sure they are accessible from your template html and will update the user interface automatically whenever the value changes.
 */

angular.module('tatool.module')
  .controller('stroopExecutableCtrl', [ '$scope', '$log', '$window', 'service',
    function ($scope, $log, $window, service) {

    // 1. Making sure we hide everything at startup
    $scope.visible = false;

    var inputEnabled = false;

    // 2. Create stimulus and set our template variables
    service.createStimulus();
    $scope.stimulusText = service.stimulusText;
    $scope.styleIsGreen = service.styleIsGreen;
    
    // 3. Show the stimulus and get the start time
    $scope.visible = true;
    $window.focus();
    inputEnabled = true;
    service.startTime = new Date().getTime();
    service.timer.start(timerUp);

    // called when timer is up to block input and stop executable
    function timerUp() {
      inputEnabled = false;
      processResponse('', new Date().getTime());
    }

    // 4. Listen to user input in the form of key press
    $scope.$on('keyPress', function(event, keyEvent) {
      if (inputEnabled) {
        if(keyEvent.which === 65 || keyEvent.which === 76) { // A-Key || L-Key
          inputEnabled = false; 
          switch (keyEvent.which) {
            case 65:
              processResponse('blue', keyEvent.timeStamp);
              break;
            case 76:
              processResponse('green', keyEvent.timeStamp);
            break
          }
        }
      }
    });

    // 5. Provide our executable service with the response and time of response
    function processResponse(givenResponse, endTime) {
      service.endTime = endTime;
      service.timer.stop();
      $scope.visible = false;
      service.processResponse(givenResponse);
    }

  }]);
