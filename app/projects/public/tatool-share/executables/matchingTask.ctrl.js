'use strict';

tatool
  .controller('matchingTaskCtrl', [ '$scope', 'service', 
    function ($scope, service) {

    $scope.stimulusService = service.stimulusService;
    $scope.inputService = service.inputService;

    $scope.start = function() {
      service.inputService.hide();
      service.inputService.disable();

      switch (service.getPhase()) {
        case 'INIT':
          service.createStimulus();
          service.setPhase('MATCHING');
          matchingPhase();
          break;
        case 'MATCHING':
          matchingPhase();
          break;
        case 'ANSWER':
          answerPhase();
          break;
      }
    };
	
	//var watcher = $scope.$on('keyPress', function(event, keyEvent) {
		// listen to key Q
		//if (keyEvent.which ==  KeyCodes.Q) {
			//service.handleEnd_min();
		//}
	//});

    // Display Stimulus on screen for a given amount of time
    function matchingPhase() {
      // increment response counter
      service.matchCounter++;

      // set phase to answer if this is the last Stimulus
      if (service.matchCounter === service.stimulus.stimulusCount) {
        service.setPhase('ANSWER');
      }

      // set Stimulus
      service.setStimulus();

      // start timer and show Stimulus
      if (service.timerEnabled.propertyValue === true) {
		  if (service.matchCounter === 1) {
			  service.timerBlankStimulus.start(matchingTimeUp);
		  } else if (service.matchCounter === 2 || service.matchCounter === 5){
			  service.timerFixationStimulus.start(matchingTimeUp);
		  } else if (service.matchCounter === 3 || service.matchCounter === 6){
			  service.timerDisplayStimulus.start(matchingTimeUp);
		  } else if (service.matchCounter === 4 || service.matchCounter === 7) {
			  service.timerMaskStimulus.start(matchingTimeUp);
		  }
      }
      service.stimulusService.show();
    }

    // Remove Stimulus from screen and display next or stop executable
    function matchingTimeUp() {
      service.stimulusService.hide();
      if (service.suspendAfterEachItem.propertyValue) {
        // suspend after each item
        service.suspendExecution();
      } else {
        if (service.getPhase() == 'MATCHING') {
          if (service.timerEnabled.propertyValue === true) {
            service.timerIntervalStimulus.start(matchingPhase);
          }
        } else {
          // suspend after all items
          // service.suspendExecution();
		  // jump to recall phase
		  answerPhase();
        }
      }
    }

    // Display question to answer Stimulus
    function answerPhase() {
      // increment response counter
      service.respCounter++;

      var stimulusText = service.answerText + ' ?';
      service.setAnswerStimulus(stimulusText);

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
	  //service.handleEnd_max();
    };

    // Provide service with the response and time of response
    function processResponse(givenResponse) {
      if (service.respCounter < 1) {
        service.addTrial(givenResponse).then(answerPhase);
      } else {
        service.setPhase('INIT');
        service.addTrial(givenResponse).then(service.stopExecution);
      }
    }

  }]);
