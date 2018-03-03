tatool.controller('multipleChoiceCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;
    $scope.answerLabels = service.answerLabels.propertyValue;

    $scope.start = function() {
      service.createStimulus();

      service.inputService.show();
      service.inputService.enable();

      service.stimulusService.show();
      service.startTime = Date.now();
    };

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.stimulusService.hide();
      service.endTime = Date.now();
      service.processResponse(input.givenResponse);
    };

  }]);
