'use strict';

tatool
  .controller('tatoolGridExecutableCtrl', [ '$scope', 'service', 
    function ($scope, service) {

    // assign grid to scope property
    $scope.dataPath = service.dataPath;
    $scope.myGrid = service.myGrid;

    $scope.start = function() {
      service.createStimulus();
    };

    $scope.userClick = function(cell, $event) {
      if (cell.data.animal !== undefined) {
        service.messageTimer.stop(); // stop any previously running timer
        processResponse('black', 'Hello, I\'m a ' + cell.data.animal + '!');
      }
    };

    $scope.userDrop = function(dragCell, dropCell) {
      if (dropCell.data.animal !== undefined) {
        service.messageTimer.stop(); // stop any previously running timer

        if (dropCell.data.animalSize > dragCell.data.animalSize) {
          processResponse('red', 'That was wrong!');
        } else {
          service.points++;
          processResponse('green', 'Correct!');
        }
      }
    };

    function processResponse(color, msg) {
      $scope.messageColor = color;
      $scope.message = msg;

      if (service.myGrid.getNumCells() === 1) {
        service.messageTimer.start(endTask);
      } else {
        service.messageTimer.start(function() { $scope.message = ''; });
      }
    }

    function endTask() {
      $scope.messageColor = 'black';
      $scope.message = 'Your Score: ' + service.points;
      service.endTimer.start(service.stopExecution);
    } 

  }]);
