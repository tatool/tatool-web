'use strict';

angular.module('tatool.module')
  .service('executionPhaseService', ['$log', '$rootScope', function ($log, $rootScope) {
    $log.debug('ExecutionPhaseListener: initialized');

    this.broadcastPhase = function(executionPhase, stack) {
      $log.debug('ExecutionPhaseListener: Broadcast ' + executionPhase);
      $rootScope.$broadcast(executionPhase, stack);
    };

  }]);