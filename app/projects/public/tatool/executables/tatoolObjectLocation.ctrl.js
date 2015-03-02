'use strict';

tatool
  .controller('tatoolObjectLocationCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.tgtGridService = service.tgtGridService;
    $scope.srcGridService = service.srcGridService;

    // start execution
    $scope.start = function() {
      service.setPhase('MEMORISATION');

      service.tgtGridService.show();
      service.srcGridService.hide();

      service.createStimulus();

      memorisationPhase();
    };

    function memorisationPhase() {
      // increment response counter
      service.memCounter++;

      if (service.memCounter >= service.stimulus.stimulusCount) {
        service.setPhase('RECALL');
      }

      // set memoranda
      service.setStimulus();

      // start timer and show memoranda
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.tgtGridService.refresh();
    }

    // remove stimulus from screen and display next or continue with recall
    function memorisationTimeUp() {
      service.tgtGridService.clear().refresh();
      if (service.getPhase() == 'MEMORISATION') {
        service.timerIntervalMemoranda.start(memorisationPhase);
      } else if (service.getPhase() == 'RECALL'){
        service.timerIntervalMemoranda.start(retrievalPhase);
      }
    }

    // display recall stimuli for drag'n'drop
    function retrievalPhase() {
      service.setRecallStimuli();
      service.srcGridService.redraw();
      service.srcGridService.show();
    }

    // capture user input
    $scope.userDrop = function(dragCell, dropCell) {
      // change target grid cell style
      var tgtCell = service.tgtGridService.getCell(dropCell.gridPosition);
      tgtCell.gridCellClass = 'tatoolObjectLocation_fillCellStatic';

      if(service.srcGridService.getCells().length > 0) {
        service.processResponse(dragCell, dropCell);
      } else {
        service.processResponse(dragCell, dropCell).then(showFeedback);
      }
    };

    // display feedback on cell level
    function showFeedback() {
      var cells = service.tgtGridService.getCells();
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (cell.data.correctResponse === cell.gridPosition) {
          cell.gridCellClass = 'tatoolObjectLocation_fillCorrectStatic';
        } else {
          cell.gridCellClass = 'tatoolObjectLocation_fillWrongStatic';
        }
      }
      service.timerFeedbackRecall.start(service.stopExecution);
    }

  }]);
