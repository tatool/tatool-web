'use strict';

tatool
  .controller('tatoolCorsiBlockCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.mainGridService = service.mainGridService;
    $scope.inputService = service.inputService;

    // start execution
    $scope.start = function() {
      service.enableInput = false;

      service.setPhase('MEMORISATION');

      service.mainGridService.show();

      service.createStimulus();

      memorisationPhase();
    };

    function memorisationPhase() {
      // increment mem counter
      service.memCounter++;

      if (service.memCounter >= service.stimulus.stimulusCount) {
        service.setPhase('RECALL');
      }

      // set memoranda
      service.setStimulus();

      // start timer and show memoranda
      service.timerIntervalMemoranda.start(function() {
        service.timerDisplayMemoranda.start(memorisationTimeUp);
        service.mainGridService.refresh();
      });

    }

    // remove stimulus from screen and display next or continue with recall
    function memorisationTimeUp() {
      service.mainGridService.clear().refresh();
      if (service.getPhase() == 'MEMORISATION') {
        service.timerIntervalMemoranda.start(memorisationPhase);
      } else if (service.getPhase() == 'RECALL'){
        service.timerIntervalMemoranda.start(recallPhase);
      }
    }

    // enable click input for recall phase
    function recallPhase() {
      service.setRecallStimulus();
      service.enableInput = true;
    }

    // display ok button to finish trial
    function showOkButton() {
      service.inputService.show();
      service.inputService.enable();
    }

    // capture user input
    $scope.userClick = function(cell, timing, $event) {
      // change target grid cell style
      if (service.enableInput && service.recallPositions.indexOf(cell.gridPosition) === -1) {
        service.enableInput = false;
        service.recallCounter++;
        service.recallPositions.push(cell.gridPosition);
        cell.gridCellClass = 'tatoolCorsiBlock_fillCell';

        service.timerRecallAnimation.start(function() { 
          cell.gridCellClass = 'tatoolCorsiBlock_clickCell'; 
        });

        service.processResponse(cell, timing).then(function() { 
          if (service.recallCounter >= service.stimulus.stimulusCount) {
            showOkButton();
          } else {
            service.enableInput = true;
          }
        });
      }
    };

    // finish trial
    $scope.okClick = function(input, timing, event) {
      service.stopExecution();
    };


  }]);
