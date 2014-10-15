'use strict';

angular.module('tatool.module')
  .controller('visualUpdatingExecutableCtrl', [ '$scope', '$log', '$timeout', 'service', 'timerService', 'tatoolGridService',
    function ($scope, $log, $timeout, service, timerService, tatoolGridService) {

    // assign grid to scope property
    $scope.dataPath = service.dataPath;
    $scope.myGrid = service.myGrid;

    /*
    $timeout(function() {
      myGrid.addCell({gridPosition: 3, stimulusValue: 'B', stimulusValueType: 'text'}).refresh();
    }, 2000);

    $timeout(function() {
      myGrid.addCell({gridPosition: 6, stimulusValue: '#00cc00', stimulusValueType: 'square'});
      myGrid.addCell({gridPosition: 5, gridCellClass: 'myColoredCell', stimulusValue: 'myClass', stimulusValueType: 'class'}).refresh();
    }, 3000);

    $timeout(function() {
      myGrid.moveCell(2, 4);
      myGrid.resize(2, 4).redraw();
    }, 4000);

    $timeout(function() {
      myGrid.swapCell(1, 6);
      myGrid.refresh();
    }, 6000);

    $timeout(function() {
      myGrid.clear().refresh();
    }, 7000);*/


    /*
    $scope.gridCells = [];

    $scope.gridCells.push({gridPosition: 1, gridCellSize: '110', stimulusValue: '#cc0000', stimulusValueType: 'circle'});
    var cell = {gridPosition: 2, gridCellSize: '110', stimulusValue: 'penguine_archigraphs_96x96.png', stimulusValueType: 'image'};
    $scope.gridCells.push(cell);

    $timeout(function() {
      $scope.gridCells.push({gridPosition: 3, gridCellSize: '110', stimulusValue: 'B', stimulusValueType: 'text'});
    }, 2000);

    $timeout(function() {
      $scope.gridCells.push({gridPosition: 6, gridCellSize: '110', stimulusValue: '#00cc00', stimulusValueType: 'square'});
      $scope.gridCells.push({gridPosition: 5, gridCellSize: '110', gridCellClass: 'myColoredCell', stimulusValue: 'myClass', stimulusValueType: 'class'});
    }, 3000);

    $timeout(function() {
      cell.gridPosition = 4;
    }, 5000);
    */

    // 4. Listen to user input in the form of key press
    $scope.$on('keyPress', function(event, keyEvent) {
      if(keyEvent.which === 37 || keyEvent.which === 38 || keyEvent.which === 39 || keyEvent.which === 40) { // Arrow keys
        switch (keyEvent.which) {
          case 37:
            action('left');
            break;
          case 38:
            action('up');
            break
          case 39:
            action('right');
            break
          case 40:
            action('down');
            break
        }
      }
    });

    function action(direction) {
      var neighbor = myCell.getNext(direction);
    
      if (neighbor !== null && neighbor.data.animal !== undefined) {
        if (neighbor.data.animal === 'Bear') {
          displayScore(myCell.data.animal);
          myCell.remove().refresh();
        } else {
          displayScore(neighbor.data.animal);
          myCell.move(direction).refresh();
        }
      } else {
        myCell.move(direction).refresh();
      }
    }

    function displayScore(animal) {
      $scope.clickMessage = 'Yummy ' + animal;
      $timeout(function() {  $scope.clickMessage = ''; }, 1500);
    }

    $scope.gridClick = function(cell, $event) {
      console.log(cell);
      if (cell.data.stimulusValue === 'penguin_96x96.png') {
        var neighbor = cell.getNext('right');
        console.log('my neighbor: ', neighbor);
        if (neighbor !== null && neighbor.data.stimulusValue === undefined) {
          cell.move('right').refresh();
        }
        $scope.clickMessage = 'Penguin!!!';
        $timeout(function() {  $scope.clickMessage = ''; }, 1500);
      }
    };

    $scope.gridDrop = function(dragCell, dropCell) {
      console.log('Drag2: ', dragCell);
      console.log('Drop2: ', dropCell);
      return true;
    };

    $scope.gridMouseEnter = function(cell, $event) {
      //console.log('Hovering over cell ' + cell.gridPosition);
    };

    $scope.gridMouseLeave = function(cell, $event) {
      
    };

  }]);
