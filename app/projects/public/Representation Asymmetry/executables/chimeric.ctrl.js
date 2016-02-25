tatool.controller('chimericCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.gridService = service.gridService;
    $scope.inputService = service.inputService;

    $scope.start = function() {
      service.createStimulus();

      service.inputService.show();

      service.startTime = service.gridService.show();
      displayStimulus();

      //Start the real timing

    };

    function displayStimulus() {
      service.timer.start(timerUp);
      service.gridService.refresh();
      service.inputService.enable();
    }

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.gridService.clear().refresh();
      service.processResponse('');
    }

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.gridService.clear().refresh();
      service.endTime = timing;
      service.processResponse(input.givenResponse, 'key');
    };

    $scope.userClick = function(cell, timing, $event) {
      if(cell.gridCellClass=="chimericStraight"){
          var response = "Left" ;
      } else {
          var response = "Right" ;
      }
      service.inputService.disable();
      service.gridService.clear().refresh();
      service.endTime = timing;
      service.processResponse(response, 'click');
    }

  }]);
