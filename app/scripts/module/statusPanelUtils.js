'use strict';

/** 
  statusPanelUtils Service  
  Updating of status panels.
**/

angular.module('tatool.module')
  .factory('statusPanelUtils', ['$rootScope', 'statusUpdate',
    function ($rootScope, statusUpdate) {

    var utils = {};

    // update feedback panel
    utils.setFeedback = function(feedback) {
      $rootScope.$broadcast(statusUpdate.FEEDBACK, feedback);
    };

    return utils;

  }]);