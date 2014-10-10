'use strict';

angular.module('tatool.module')
  .controller('visualUpdatingExecutableCtrl', [ '$scope', '$log', '$timeout', 'service', 'timerService', 
    function ($scope, $log, $timeout, service, timerService) {

    $scope.dataPath = 'data/';

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
      //$scope.gridCells[5].gridPosition = 2;
      //$scope.gridCells[1].gridPosition = 4;
      cell.gridPosition = 4;
      //$scope.gridCells.push({gridPosition: 4, gridCellSize: '110', stimulusValue: 'penguine_archigraphs_96x96.png', stimulusValueType: 'image'});
      //$scope.gridCells.push({gridPosition: 2, gridCellSize: '110', stimulusValue: '', stimulusValueType: 'text'});
    }, 5000);

    $scope.gridClick = function(cell, $event) {
      console.log(cell);
      if (cell.stimulusValue === 'penguine_archigraphs_96x96.png') {
        $scope.clickMessage = 'Penguin!!!';
        $timeout(function() {  $scope.clickMessage = ''; }, 1500);
      }
    };

    $scope.gridMouseEnter = function(cell, $event) {
      //console.log('Hovering over cell ' + cell.gridPosition);
    };

    $scope.gridMouseLeave = function(cell, $event) {
      
    };

  }]);
