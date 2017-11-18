'use strict';

tatool
  .controller('memoryClassifyCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.gridService = service.gridService;

    // start execution
    $scope.start = function() {
      service.setPhase('ENCODING');

      // set grid to 1 row 3 cols
      service.gridService.clear().refresh();
      service.gridService.resize(1,3).redraw();

      // start encoding phase
      encodingPhase();
    };

    function encodingPhase() {
      service.setPhase('RECALL');
      service.createStimulus();

      service.setEncodingStimuli();
      service.gridService.refresh();

      service.gridService.show();
      service.timerDisplayEncoding.start(encodingTimeUp);
    }

    function encodingTimeUp() {
      service.gridService.hide();
      service.timerIntervalEncoding.start(recallPhase);
    }

    //function updatingPhase() {
    //  service.createStimulus();
      // skip catch trials
    //  if (parseInt(service.stimulus['phase']) === 1 && parseInt(service.stimulus['step']) === 0) {
    //    service.setPhase('RECALL');
    //    recallPhase();
    //  } else {
    //    service.gridService.clear();
    //    service.setUpdatingStimuli();
    //    service.gridService.refresh();
    //    service.gridService.show();
    //    service.timerDisplayUpdating.start(updatingTimeUp);
    //  }
    //}

    //function updatingTimeUp() {
    //  service.gridService.hide();
    //  if (service.getPhase() === 'UPDATING') {
    //    service.timerIntervalUpdating.start(updatingPhase);
    //  } else {
    //    service.timerIntervalUpdating.start(recallPhase);
    //  }
    //}

    function recallPhase() {
      service.gridService.clear();

      // resize grid to 5 cols and 5 rows
      //service.gridService.resize(5,5).redraw();

      service.createStimulus();
      service.setRecallStimuli();
      service.gridService.refresh();
      service.startTime = service.gridService.show();
    }

    $scope.userClick = function(cell, timing, $event) {
      if (cell.data.order) {
        service.gridService.hide();
        service.endTime = timing;
        service.processResponse(cell.data.order, timing).then(nextStep);
      }
    };

    function nextStep() {
      if (service.getPhase() === 'RECALL') {
        recallPhase();
      } else {
        service.stopExecution();
      }
    }

  }]);
