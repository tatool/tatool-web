'use strict';

TrialService.$inject = ['$log', '$q', '$rootScope', 'trialDataService', 'tatoolPhase'];

function TrialService($log, $q, $rootScope, trialDataService, tatoolPhase) {
    $log.debug('TrialService: initialized');

    var trialService = {};

    var currentTrials = [];

    trialService.clearCurrentTrials = function() {
      currentTrials = [];
    };

    trialService.getCurrentTrials = function() {
      return currentTrials;
    };

    trialService.addTrial = function(trial, showStatusFeedback) {
      var deferred = $q.defer();
      var trialTime = new Date().getTime();
      var _id = trial.moduleId + '_' + ('000000'+ trial.sessionId ).slice(-6) + '_' + trialTime;

      // making sure we create a new trial object in order not to use the same reference
      var newTrial = {_id: _id};
      angular.extend(newTrial, trial);
      currentTrials.push(newTrial);

      // broadcast event for everyone interested in a finished trial
      showStatusFeedback = (showStatusFeedback === false) ? false : true;
      $rootScope.$broadcast(tatoolPhase.TRIAL_SAVE, newTrial, showStatusFeedback);

      // save to db
      trialDataService.addTrial(newTrial).then(function(data) {
        deferred.resolve(data);
      }, function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    };

    return trialService;
  }

  export default TrialService;
