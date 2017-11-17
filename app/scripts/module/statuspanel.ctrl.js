'use strict';

StatusPanelCtrl.$inject = ['$scope', '$rootScope', '$log', '$timeout', '$interval', 'statusPanelService', 'status', 'tatoolPhase', 'cfgModule', 'statusUpdate'];

function StatusPanelCtrl($scope, $rootScope, $log, $timeout, $interval, statusPanelService, status, tatoolPhase, cfgModule, statusUpdate) {

    $scope.imgPath = cfgModule.MODULE_IMG_PATH;
    
    // listening to real-time events which should update ui immediately
    $scope.$on(tatoolPhase.TRIAL_SAVE, function(arg, trial, showStatusFeedback) {
      if (showStatusFeedback) {
        $scope.feedback = statusPanelService.updateFeedback(trial.score);
      }
    });
    $scope.$on(tatoolPhase.LEVEL_CHANGE, function(arg, currentLevel) {
      statusPanelService.updateLevel(currentLevel);
    });
    $scope.$on(statusUpdate.FEEDBACK, function(arg, score) {
      $scope.feedback = statusPanelService.updateFeedback(score);
    });

    if (status) {
      $scope.levelPanel = status.levelPanel;
      $scope.feedbackPanel = status.feedbackPanel;
      $scope.trialCountPanel = status.trialCountPanel;
      $scope.timerPanel = status.timerPanel;
    } else {
      $scope.levelPanel = false;
      $scope.feedbackPanel = false;
      $scope.trialCountPanel = false;
      $scope.timerPanel = false;
    }

    // Level Panel
    $scope.level = statusPanelService.currentLevel;
    $scope.levelPanelAnimate = statusPanelService.levelPanelAnimate;

    // Feedback Panel
    $scope.feedback = statusPanelService.feedback;

    // Trial Count Panel
    $scope.trialCount = statusPanelService.trialCount;

    // Timer Panel
    $scope.progress = statusPanelService.timerProgress;

    $scope.$watch(function () { return statusPanelService.timerProgress; },
      function () {
        $scope.progress = statusPanelService.timerProgress;
      }
    );
    
}

export default StatusPanelCtrl;
