'use strict';

tatool
  .controller('numberKeepTrackCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.gridService = service.gridService;
    $scope.inputService = service.inputService;

    // start execution
    $scope.start = function() {
      service.setPhase('ENCODING');

      // set grid to 1 row 4 cols
      service.gridService.clear().refresh();
      service.gridService.resize(1,4).redraw();

      // start encoding phase
      encodingPhase();
    };

    function encodingPhase() {
      service.setPhase('UPDATING');
      service.createStimulus();

      service.setEncodingStimuli();
      service.gridService.refresh();

      service.gridService.show();
      service.timerDisplayEncoding.start(encodingTimeUp);
    }

    // remove stimulus from screen and display next or continue with recall
    function encodingTimeUp() {
      service.gridService.clear().refresh();
      service.gridService.resize(1,1).redraw();
      service.timerIntervalEncoding.start(updatingPhase);
    }

    function updatingPhase() {
      service.createStimulus();
      // skip catch trials
      if (parseInt(service.stimulus['phase']) === 1 && parseInt(service.stimulus['step']) === 0) {
        service.setPhase('RECALL');
        recallPhase();
      } else {
        service.setUpdatingStimuli();
        service.gridService.refresh();
        service.timerDisplayUpdating.start(updatingTimeUp);
      }
    }

    // remove stimulus from screen and display next or continue with updating
    function updatingTimeUp() {
      service.gridService.clear().refresh();
      if (service.getPhase() === 'UPDATING') {
        service.timerIntervalUpdating.start(updatingPhase);
      } else {
        service.timerIntervalUpdating.start(recallPhase);
      }
    }

    // display recall stimuli 
    function recallPhase() {
      service.createStimulus();
      service.setRecallStimuli();
      service.gridService.refresh();
      service.inputService.enable();
      service.startTime = service.gridService.show();
    }

    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.gridService.clear().refresh();
      service.processResponse(input.givenResponse, timing).then(nextStep);
    };

    function nextStep() {
      if (service.getPhase() === 'RECALL') {
        recallPhase();
      } else {
        service.gridService.hide();
        service.stopExecution();
      }
    }

  }]);
