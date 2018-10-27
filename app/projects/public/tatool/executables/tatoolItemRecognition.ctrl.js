'use strict';

tatool
  .controller('tatoolItemRecognitionCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;

    // start execution
    $scope.start = function() {
      startStimulus();
    };

    function startStimulus() {
      service.createStimulus();
      showStimulus();
    }

    function showStimulus() {
      // encoding: present memoranda
      if (service.getPhase() == 1) {
        service.stimulusService.show();
        service.timerEncoding.start(showBlank);
      // recognition: present probes
      } else if (service.getPhase() == 2) {
        service.inputService.enable();

        if (service.showKeys.propertyValue === true) {
          service.inputService.show();
        }

        service.startTime = service.stimulusService.show();
      // instructions
      } else {
        service.stimulusService.show();
        service.timerInstruction.start(showBlank);
      }
    }

    function showBlank() {
      service.stimulusService.hide();
      service.timerBlank.start(startStimulus);
    }
    
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.inputService.hide();
      service.stimulusService.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
      service.timerBlank.start(service.endTask());
    };

  }]);
