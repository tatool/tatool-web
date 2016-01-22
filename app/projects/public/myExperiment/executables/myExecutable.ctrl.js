tatool.controller('myExecutableCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;
    
    $scope.start = function() {
      service.createStimulus();

      service.inputService.show();
      service.inputService.enable();

      service.startTime = service.stimulusService.show();
    };

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.stimulusService.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);