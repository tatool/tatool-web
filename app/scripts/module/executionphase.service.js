'use strict';

ExecutionPhaseService.$inject = ['$log', '$rootScope'];

function ExecutionPhaseService($log, $rootScope) {
    $log.debug('ExecutionPhaseListener: initialized');

    this.broadcastPhase = function(executionPhase, stack) {
      $log.debug('ExecutionPhaseListener: Broadcast ' + executionPhase);
      $rootScope.$broadcast(executionPhase, stack);
    };

    return this;
}

export default ExecutionPhaseService;