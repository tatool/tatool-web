'use strict';

tatool
  .controller('tatoolLocalRecognitionCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.gridService = service.gridService;
    $scope.inputService = service.inputService;

    // start execution
    $scope.start = function() {
      service.setPhase('MEMORISATION');
      service.gridService.clear();

      service.gridService.show();

      service.createStimulus();

      memorisationPhase();
    };

    function memorisationPhase() {
      // increment response counter
      service.memCounter++;

      if (service.memCounter >= service.stimulus.stimulusCount) {
        service.setPhase('RECOGNITION');
      }

      // set memoranda
      service.setStimulus();

      // start timer and show memoranda
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.gridService.refresh();
    }

    // remove stimulus from screen and display next or continue with recall
    function memorisationTimeUp() {
      service.gridService.clear().refresh();

      if (service.getPhase() == 'MEMORISATION') {
        service.timerIntervalMemoranda.start(memorisationPhase);
      } else if (service.getPhase() == 'RECOGNITION'){
        service.timerIntervalProbe.start(recognitionPhase);
      }
    }

    // display probes
    function recognitionPhase() {
      service.probeCounter++;

      service.setProbe();
      service.inputService.enable();
      service.startTime = service.inputService.show();
      service.gridService.refresh();
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.endTime = timing;
      service.processResponse(parseInt(input.givenResponse));

      if (service.probeCounter >= service.stimulus.stimulusCount) {
        service.stopExecution();
      } else {
        service.gridService.clear().refresh();
        recognitionPhase();
      }
    };

  }]);
