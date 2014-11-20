'use strict';

tatool
  .controller('tatoolComplexSpanCtrl', [ '$scope', '$log', '$timeout', 'service', 'timerService', 
    function ($scope, $log, $timeout, service, timerService) {

    $scope.stimulus = service.stimulus;
    $scope.input = service.input;

    var memCounter;

    $scope.start = function() {
      service.input.hide();
      service.input.disable();

      memCounter = 1;

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
    };

    // Displays memoranda on screen for a given amount of time
    function memorisationPhase() {
      // set phase to recall if this is the last memoranda
      if (memCounter == service.digits.length) {
        service.setPhase('RECALL');
      }

      // set memoranda
      service.setStimulus(memCounter);

      // start timer and show memoranda
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.stimulus.show();

      // increment memorisation counter
      memCounter++;
    }

    // Remove memoranda from screen and display next or stop executable
    function memorisationTimeUp() {
      service.stimulus.hide();
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
      var stimulusText = 'Digit ' + service.respCounter + ' ?';
      service.setRecallStimulus(stimulusText);

      service.startTime = service.stimulus.show();      
      service.input.show();
      service.input.enable();
    }

    // Captures user input
    $scope.inputAction = function(input, timing, event) {
      service.input.disable();
      service.input.hide();
      service.stimulus.hide();

      service.endTime = timing;
      processResponse(input.givenResponse);
    };

    // Provide our executable service with the response and time of response
    function processResponse(givenResponse) {
      if (service.respCounter < service.digits.length) {
        service.addTrial(givenResponse).then(recallPhase());
      } else {
        service.setPhase('INIT');
        service.addTrial(givenResponse).then(service.stopExecution());
      }
    }

  }]);
