'use strict';

angular.module('tatool.module').directive('tatoolGrid', ['$log', 'cfgModule', function($log, cfgModule) {
  return {
    restrict: 'E',
    scope: {
      gridid: '@',
      cellclass: '@',
      grid: '=',
      cellsize: '@',
      hideemptycells: '@',
      disablehover: '@',
      datapath: '@',
      gridclick: '&',
      gridmouseenter: '&',
      gridmouseleave: '&'
    },
    link: function (scope, element, attr) {

      // clean datapath value if given
      if (scope.datapath === undefined) {
        scope.tatoolDataPath = '';
      } else {
        if (scope.datapath.indexOf('/', scope.datapath.length - 1) === -1) {
          scope.tatoolDataPath = scope.datapath + '/';
        } else {
          scope.tatoolDataPath = scope.datapath;
        }
      }

      // set gridId to default if not given
      var gridId = 'default';
      if (scope.gridid !== undefined) {
        gridId = scope.gridid;
      }
      
      // initialize grid UI
      scope.cells = scope.grid.cells;   // grid given to directive
      var coordinates = {};             // used as a shortcut object to transform position to row/col
      var cellsUsed = [];               // holds the cells which contain user content

      // initialize grid
      var initGrid = function() {

        scope.gridCells = [];
        for(var i = 0; i < scope.grid.rows; i++) {
          var row = [];
          scope.gridCells.push(row);
          for(var j = 1; j <= scope.grid.cols; j++) {
            var position = (scope.grid.cols * i) + j;

            var cell = {gridPosition: position, data: {}};
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
        // provide the grid with the coordinate lookup array
        scope.grid.coordinates = coordinates;
      };

      // init cell with values
      var initCell = function(cell) {

        // set cellsize (priority: cell/grid/default)
        if (cell.gridCellSize === undefined) {
          cell.gridCellSize = scope.cellsize;
        }

        // procoess built-in stimulus value types (circle/square)
        if(cell.data.stimulusValueType === 'circle' || cell.data.stimulusValueType === 'square') {
          if (cell.data.stimulusValue === undefined) {
            cell.data.stimulusValue = '#666666';
          }
        }
        
        // set cellclass (priority: cell/grid/default)
        if (cell.gridCellClass === undefined) {
          if (scope.hideemptycells !== undefined && scope.hideemptycells === 'yes' && cell.data.stimulusValue === undefined) {
            cell.gridCellClass = 'hideCell';
          } else {
            if (scope.disablehover === 'yes' || attr.gridclick === undefined) {
              if (scope.cellclass === undefined) {
                cell.gridCellClass = 'cellStatic';
              } else {
                cell.gridCellClass = scope.cellclass + 'Static';
              }
            } else {
              if (scope.cellclass === undefined) {
                cell.gridCellClass = 'cell';
              } else {
                cell.gridCellClass = scope.cellclass;
              }
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
          'background-color':cell.data.stimulusValue
        };
        cell.gridCellOverrideStyle = cellOverrideStyle;
        cell.gridCellValueOverrideStyle = cellValueOverrideStyle;

        return cell;
      };

      // initialize grid
      initGrid();

      // init cell with values
      var refreshGrid = function() {
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
            var emptyCell = {gridPosition: position, data: {}};
            emptyCell = initCell(emptyCell);
            var oldCellRow = coordinates[position].row;
            var oldCellCol = coordinates[position].col;
            scope.gridCells[oldCellRow][oldCellCol] = emptyCell;
          }
        }

        cellsUsed = cellsUsedNew;
      };

      // listen to refresh calls of this grid to initiate UI update
      scope.$on('tatool-grid:refresh', function (event, targetGridId) {
        console.log('refresh grid');
        if (targetGridId === gridId) {
          refreshGrid();
        }
      });

      // listen to redraw calls of this grid to initiate UI update
      scope.$on('tatool-grid:redraw', function (event, targetGridId) {
        console.log('redraw grid');
        if (targetGridId === gridId) {
          initGrid();
        }
      });

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