'use strict';

tatool
  .controller('tatoolMonitoringCtrl', [ '$scope', 'service',
    function ($scope, service) {

    // Make the stimulus service available for the <tatool-stimulus> directive
    $scope.mainGridService = service.mainGridService;
    $scope.cellHeight = service.cellHeight;
    $scope.cellWidth = service.cellWidth;

    // Make the input service available for the <tatool-input> directive
    $scope.inputService = service.inputService;

    // Start execution
    $scope.start = function() {
      service.mainGridService.clear();
      
      service.createStimulus();
      service.setStimulus();

      service.startTime = service.mainGridService.show();
      service.mainGridService.refresh();

      service.inputService.enable();

      if (service.showKeys.propertyValue === true) {
        service.inputService.show();
      }

      service.timer.start(timerUp);
    };

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.startTime;
      service.endTask();
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.inputService.hide();
      service.endTime = timing;
      service.responseGiven = true;
      service.processResponse(input.givenResponse);
    };

  }]);
