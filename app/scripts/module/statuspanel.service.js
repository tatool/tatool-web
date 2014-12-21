'use strict';

angular.module('tatool.module')
  .factory('statusPanelService', [ '$log', '$rootScope', '$timeout', 'tatoolPhase', 'statusUpdate',
    function ($log, $rootScope, $timeout, tatoolPhase, statusUpdate) {

	var service = {};

  // reset feedback in EXECUTE_START phase
  $rootScope.$on(tatoolPhase.EXECUTABLE_START, function() {
    service.updateFeedback();
    service.updateTimer(0);
  });

  // PUBLIC methods
  service.setFeedback = function(feedback) {
    $rootScope.$broadcast(statusUpdate.FEEDBACK, feedback);
  };


  // PRIVATE methods
	
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
  service.updateFeedback = function(feedback, immediate) {
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
  };

  // Return our service object
  return service;

}]);
