tatool.controller('verbalReasoningCtrl', [ '$scope', 'service',
  function ($scope, service) {

    $scope.inputService = service.inputService;

    $scope.start = function() {
      var stimulus = service.createStimulus();

      service.inputService.show();
      service.inputService.enable();

      var stimulusText = stimulus.stimulusValue;

      var splitText = stimulusText.split('!');
      var splitAnswers = splitText[1].split(',');

      $scope.stimulusQuestion = splitText[0];
      $scope.stimulusAnswers = splitAnswers;
      service.startTime = Date.now();
    };

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.endTime = Date.now();
      service.responseTime = service.endTime - service.startTime;
      service.processResponse(input.givenResponse);
    };

  }]);
