'use strict';

tatool
  .controller('tatoolComplexSpanCtrl', [ '$scope', '$log', '$timeout', 'service', 'timerService', 
    function ($scope, $log, $timeout, service, timerService) {

    $scope.stimulus = service.tatoolStimulus;
    $scope.input = service.tatoolInput;

    $scope.start = function() {
      service.tatoolInput.hide();
      service.tatoolInput.disable();

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
      // increment response counter
      service.memCounter++;

      // set phase to recall if this is the last memoranda
      if (service.memCounter === service.stimulus.stimulusCount) {
        service.setPhase('RECALL');
      }

      // set memoranda
      service.setStimulus();

      // start timer and show memoranda
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.tatoolStimulus.show();
    }

    // Remove memoranda from screen and display next or stop executable
    function memorisationTimeUp() {
      service.tatoolStimulus.hide();
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

      service.startTime = service.tatoolStimulus.show();      
      service.tatoolInput.show();
      service.tatoolInput.enable();
    }

    // Captures user input
    $scope.inputAction = function(input, timing, event) {
      service.tatoolInput.disable();
      service.tatoolInput.hide();
      service.tatoolStimulus.hide();

      service.endTime = timing;
      processResponse(input.givenResponse);
    };

    // Provide our executable service with the response and time of response
    function processResponse(givenResponse) {
      if (service.respCounter < service.stimulus.stimulusCount) {
        service.addTrial(givenResponse).then(recallPhase);
      } else {
        service.setPhase('INIT');
        service.addTrial(givenResponse).then(service.stopExecution);
      }
    }

  }]);
