'use strict';

angular.module('tatool.module')
  .controller('complexNumExecutableCtrl', [ '$scope', '$log', '$timeout', 'service', 'timerService', 
    function ($scope, $log, $timeout, service, timerService) {

    // 1. Making sure we hide everything at startup
    $scope.stimulusVisible = false;
    $scope.inputVisible = false;

    // 2. Set internal variables which will only be available within this execution
    var inputEnabled = false;
    var memCounter = 1;

    // 3. Decide which phase to run
    switch (service.getPhase()) {
      case 'INIT':
        service.createStimulus();
        service.setPhase('MEMORISATION');
        memorisationPhase();
        break;
      case 'MEMORISATION':
        memorisationPhase();
        break;
      case 'RECALL':
        recallPhase();
        break;
    }
    
    // Displays memoranda on screen for a given amount of time
    function memorisationPhase() {
      // set phase to recall if this is the last memoranda
      if (memCounter == service.digits.length) {
        service.setPhase('RECALL');
      }

      // display memoranda
      $scope.stimulusText = service.digits[memCounter - 1];
      $scope.stimulusVisible = true;

      // start timer
      service.timerDisplayMemoranda.start(timerUp);

      // increment memorisation counter
      memCounter++;
    }

    // Remove memoranda from screen and display next or stop executable
    function timerUp() {
      $scope.stimulusVisible = false;
      if (service.getPhase() == 'MEMORISATION') {
        service.timerIntervalMemoranda.start(memorisationPhase);
      } else {
        service.stopExecution();
      }
    }

    // Displays question to recall memoranda
    function recallPhase() {

      // increment response counter
      service.respCounter++;

      // display recall queue
      $scope.stimulusText = 'Digit ' + service.respCounter + ' ?';
      $scope.stimulusVisible = true;
      $scope.inputVisible = true;
      service.startTime = new Date().getTime();

      // focus on input element and allow input
      angular.element(document.querySelector('.textInput')).focus();
      inputEnabled = true;
    }

    // Listen to user input in the form of key press
    $scope.$on('keyPress', function(event, keyEvent) {
      if (inputEnabled) {
        if(keyEvent.which === 13) { // Enter-Key
          inputEnabled = false;
          processResponse($scope.givenResponse, keyEvent.timeStamp);
          $scope.givenResponse = '';
        } 
      }
    });

    // Provide our executable service with the response and time of response
    function processResponse(givenResponse, endTime) {
      service.endTime = endTime;
      $scope.stimulusVisible = false;
      $scope.inputVisible = false;

      if (service.respCounter < service.digits.length) {
        service.processResponse(givenResponse).then(recallPhase());
      } else {
        service.setPhase('INIT');
        service.processResponse(givenResponse).then(service.stopExecution());
      }
    }

  }]);
