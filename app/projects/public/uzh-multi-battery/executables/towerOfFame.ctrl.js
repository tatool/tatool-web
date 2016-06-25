tatool.controller('towerOfFameCtrl', ['$scope', 'service', 'executableUtils',
  function($scope, service, executableUtils) {
    
    $scope.stimulusService = service.stimulusService;

    // default settings for radio input
    $scope.radioInputShow = false;
    $scope.radioFloor = '';
    $scope.radioFlat = '';
    $scope.radioNextEnabled = true;

    // UI strings
    $scope.floorLabel = service.floorLabel;
    $scope.apartmentLabel = service.apartmentLabel;
    $scope.choiceUnknownLabel = service.choiceUnknownLabel;
    $scope.buttonLabel = service.buttonLabel;

    $scope.start = function() {
      service.createStimulus();

      memorisationPhase();
    };

    function memorisationPhase() {
      // increment memoranda counter
      service.memCounter++;

      // set memoranda
      service.setStimulus();

      // display stimulus
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.startTime = service.stimulusService.show();
    }

    // remove memoranda from screen and display next or go to recall
    function memorisationTimeUp() {
      service.stimulusService.hide();

      if (service.memCounter === service.stimulus.stimulusCount) {
        recallPhase();
      } else {
        service.timerIntervalMemoranda.start(memorisationPhase);
      }
    }

    function recallPhase() {
      // reset values
      $scope.radioFloor = '';
      $scope.radioFlat = '';

      // increment response counter
      service.respCounter++;

      // set recall stimulus
      service.setRecallPrompt();

      // show recall stimulus
      service.startTime = service.stimulusService.show();

      // show input
      $scope.radioInputShow = true;
    }

    // listen for next button press
    $scope.inputAction = function(floor, flat) {
      service.endTime = executableUtils.getTiming();
      service.stimulusService.hide();
      $scope.radioInputShow = false;

      processResponse(floor + flat);
    };

    // Provide service with the response and time of response
    function processResponse(givenResponse) {
      if (service.respCounter < service.stimulus.stimulusCount) {
        service.addTrial(givenResponse).then(recallPhase);
      } else {
        service.addTrial(givenResponse).then(service.stopExecution);
      }
    }

    // observe radio input to enable next button
    $scope.$watch('radioFloor', function() {
      if ($scope.radioFlat != '' && $scope.radioFloor != '') {
        $scope.radioNextEnabled = false;
      }
    });

    $scope.$watch('radioFlat', function() {
      if ($scope.radioFlat != '' && $scope.radioFloor != '') {
        $scope.radioNextEnabled = false;
      }
    });

  }
]);