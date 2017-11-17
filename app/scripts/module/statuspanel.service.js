'use strict';

StatusPanelService.$inject = ['$log', '$rootScope', '$timeout', 'tatoolPhase'];

function StatusPanelService($log, $rootScope, $timeout, tatoolPhase) {

	var service = {};

  // reset feedback in EXECUTE_START phase
  $rootScope.$on(tatoolPhase.EXECUTABLE_START, function() {
    service.updateFeedback();
    service.updateTimer(0);
  });

  // level panel
	service.updateLevel = function(currentLevel) {
    if (service.currentLevel !== currentLevel && service.currentLevel) {
      service.levelPanelAnimate = true;
      $timeout(function() {service.levelPanelAnimate = false;}, 250);
    } else {
      service.levelPanelAnimate = false;
    }
		service.currentLevel = currentLevel;
	};

  // feedback panel
  service.updateFeedback = function(feedback) {
    if (feedback === undefined) {
      service.feedback = null;
    } else if (feedback >= 1) {
      service.feedback = 'correct';
    } else if (feedback === 0) {
      service.feedback = 'wrong';
    }
    return service.feedback;
  };

  // trial count panel
  service.updateTrialCount = function(counter) {
    service.trialCount = counter;
  };

  service.updateTimer = function(timerStatus) {
    service.timerProgress = timerStatus.progress;
    // necessary due to calls outside of angular context
    $rootScope.$evalAsync();
  };

  // Return our service object
  return service;

}

export default StatusPanelService;
