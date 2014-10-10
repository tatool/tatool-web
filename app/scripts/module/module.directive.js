'use strict';

angular.module('tatool.module').directive('tatoolGrid', ['$log', 'cfgModule', function($log, cfgModule) {
  return {
    restrict: 'E',
    scope: {
      cellclass: '@',
      rows: '@',
      cols: '@',
      cells: '=',
      cellsize: '@',
      hideemptycells: '@',
      disablehover: '@',
      datapath: '@',
      gridclick: '&',
      gridmouseenter: '&',
      gridmouseleave: '&'
    },
    link: function (scope, element) {
      
      scope.gridCells = [];
      var coordinates = {};
      var cellsUsed = [];

      var initGrid = function() {
        // creating grid and adding cells
        for(var i = 0; i < scope.rows; i++) {
          var row = [];
          scope.gridCells.push(row);
          for(var j = 1; j <= scope.cols; j++) {
            var position = (scope.cols * i) + j;
            var cell = {gridPosition: position};
            coordinates[position] = {row: i, col: (j - 1)};

            for (var k = 0; k < scope.cells.length; k++) {
              if (scope.cells[k].gridPosition === position) {
                cell = scope.cells[k];
                cellsUsed.push(position);
              }
            }

            cell = initCell(cell);

            row.push(cell);
          }
        }
      };

      // init cell with values
      var initCell = function(cell) {

        if (cell.gridCellSize === undefined) {
          cell.gridCellSize = scope.cellsize;
        }
        
        // set default cellClass if no class given with cell
        if (cell.gridCellClass === undefined) {

          if (scope.hideemptycells !== undefined && scope.hideemptycells === 'yes' && cell.stimulusValue === undefined && cell.stimulusValueType !== 'circle' && cell.stimulusValueType !== 'square') {
            cell.gridCellClass = 'hideCell';
          } else {
            if (scope.cellclass === undefined) {
              if (scope.disablehover === 'yes') {
                cell.gridCellClass = 'cellStatic';
              } else {
                cell.gridCellClass = 'cell';
              }
            } else {
              cell.gridCellClass = scope.cellclass;
            }
          }
                
        }

        // create override styles for cell size and cellValue
        var cellOverrideStyle = {
          'width':cell.gridCellSize + 'px',
          'height':cell.gridCellSize + 'px',
          'min-width':cell.gridCellSize + 'px',
          'min-height':cell.gridCellSize + 'px'
        };
        var cellValueOverrideStyle = {
          'background-color':cell.stimulusValue
        };
        cell.gridCellOverrideStyle = cellOverrideStyle;
        cell.gridCellValueOverrideStyle = cellValueOverrideStyle;

        return cell;
      };

      // initialize grid
      initGrid();

      // watch for changes to cells and update grid accordingly
      scope.$watch('cells', function() {
        var cellsUsedNew = [];

        // update cells
        for (var c = 0; c < scope.cells.length; c++) {
          var cell = scope.cells[c];
          var cellPosition = cell.gridPosition;

          cellsUsedNew.push(cellPosition);

          var targetCellRow = coordinates[cellPosition].row;
          var targetCellCol = coordinates[cellPosition].col;
          var targetCell = scope.gridCells[targetCellRow][targetCellCol];

          if (!angular.equals(targetCell, cell)) {
            cell = initCell(cell);
            scope.gridCells[targetCellRow][targetCellCol] = cell;
          }
        }

        // remove cells
        for (var r = 0; r < cellsUsed.length; r++) {
          var position = cellsUsed[r];
          if (cellsUsedNew.indexOf(position) === -1) {
            var emptyCell = {gridPosition: position};
            emptyCell = initCell(emptyCell);
            var oldCellRow = coordinates[position].row;
            var oldCellCol = coordinates[position].col;
            scope.gridCells[oldCellRow][oldCellCol] = emptyCell;
          }
        }

        cellsUsed = cellsUsedNew;
      }, true);

      // clean datapath if available
      if (scope.datapath === undefined) {
        scope.tatoolDataPath = '';
      } else {
        if (scope.datapath.indexOf('/', scope.datapath.length - 1) === -1) {
          scope.tatoolDataPath = scope.datapath + '/';
        } else {
          scope.tatoolDataPath = scope.datapath;
        }
      }

      scope.getValue = function(value) {
        console.log('redraw ' + value);
      };

      scope.gridClickEvent = function($event, cell) {
        if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        scope.gridclick({'cell': cell, '$event': $event});
      };

      scope.gridMouseEnterEvent = function($event, cell) {
        scope.gridmouseenter({'cell': cell, '$event': $event});
      };

      scope.gridMouseLeaveEvent = function($event, cell) {
        scope.gridmouseleave({'cell': cell, '$event': $event});
      };

      element.on('$destroy', function() {
        console.log('clean up grid');
      });
    },
    templateUrl: '../../views/module/tatoolGrid.html'
  };
}]);