'use strict';

tatool
  .controller('lucoListSwitchingCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.gridService = service.gridService;
    $scope.inputService = service.inputService;

    // Start execution
    $scope.start = function() {
      startStimulus();
    };

    function startStimulus() {
      service.createStimulus();
      showStimulus();
    }

    function showStimulus() {
      // warning
      if (service.getPhase() == 0) {
        service.gridService.clear().refresh();
        service.setStimulus();
        service.gridService.refresh();
        service.gridService.show();
        service.timerWarning.start(startStimulus);
        // encoding
      } else if (service.getPhase() == 1) {
        service.gridService.clear().refresh();
        service.setStimulus();
        service.gridService.refresh();
        service.gridService.show();
        service.timerEncoding.start(showBlank);
        // recall
      } else {
        service.setCue();
        service.gridService.refresh();
        service.gridService.show();
        service.timerCue.start(showProbe);
      }
    }

    function showBlank() {
      service.gridService.clear().refresh();
      service.gridService.hide();
      service.timerBlank.start(startStimulus);
    }

    function showProbe() {
        service.gridService.clear().refresh();
        service.setStimulus();
        service.gridService.refresh();
        service.inputService.enable();

        if (service.showKeys.propertyValue === true) {
          service.inputService.show();
        }

        service.startTime = service.gridService.show();
    }
    
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.gridService.clear().refresh();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
