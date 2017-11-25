'use strict';

/** 
  statusPanelUtils Service  
  Updating of status panels.
**/

StatusPanelUtilsService.$inject = ['$rootScope', 'statusUpdate'];

function StatusPanelUtilsService($rootScope, statusUpdate) {

    var utils = {};

    // update feedback panel
    utils.setFeedback = function(feedback) {
      $rootScope.$broadcast(statusUpdate.FEEDBACK, feedback);
    };

    return utils;

}

export default StatusPanelUtilsService;