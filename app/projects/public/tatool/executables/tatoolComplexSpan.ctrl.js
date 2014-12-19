'use strict';

tatool
  .controller('tatoolComplexSpanCtrl', [ '$scope', 'service', 
    function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;

    $scope.start = function() {
      service.inputService.hide();
      service.inputService.disable();

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

    // Display memoranda on screen for a given amount of time
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
      service.stimulusService.show();
    }

    // Remove memoranda from screen and display next or stop executable
    function memorisationTimeUp() {
      service.stimulusService.hide();
      if (service.getPhase() == 'MEMORISATION') {
        service.timerIntervalMemoranda.start(memorisationPhase);
      } else {
        service.stopExecution();
      }
    }

    // Display question to recall memoranda
    function recallPhase() {
      // increment response counter
      service.respCounter++;

      var stimulusText = 'Stimulus ' + service.respCounter + ' ?';
      service.setRecallStimulus(stimulusText);

      service.startTime = service.stimulusService.show();      
      service.inputService.show();
      service.inputService.enable();
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.inputService.hide();
      service.stimulusService.hide();

      service.endTime = timing;
      processResponse(input.givenResponse);
    };

    // Provide service with the response and time of response
    function processResponse(givenResponse) {
      if (service.respCounter < service.stimulus.stimulusCount) {
        service.addTrial(givenResponse).then(recallPhase);
      } else {
        service.setPhase('INIT');
        service.addTrial(givenResponse).then(service.stopExecution);
      }
    }

  }]);
