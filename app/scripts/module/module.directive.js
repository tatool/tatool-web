'use strict';

angular.module('tatool.module').directive('tatoolGrid', ['$log', 'cfgModule', function($log, cfgModule) {
  return {
    restrict: 'E',
    scope: {
      cellclass: '@',
      grid: '=',
      cellsize: '@',
      hideemptycells: '@',
      disablehover: '@',
      datapath: '@',
      gridclick: '&',
      griddrop: '&',
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
        if (targetGridId === scope.grid.gridId) {
          console.log('refresh grid ' + targetGridId);
          refreshGrid();
        }
      });

      // listen to redraw calls of this grid to initiate UI update
      scope.$on('tatool-grid:redraw', function (event, targetGridId) {
        if (targetGridId === scope.grid.gridId) {
          console.log('redraw grid '  + targetGridId);
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

      scope.gridDrop = function(dragCell, dropCell) {
        var dropAllowed = scope.griddrop({'dragCell': dragCell, 'dropCell': dropCell});
        return dropAllowed;
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



angular.module('tatool.module').directive('draggable', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var jelement = $(element);
      var originalClass;

      jelement.draggable( {
        start: handleStartEvent,
        stop: handleStopEvent,
        cursor: 'move',
        zIndex: 5000,
        revert: "invalid",
        snap: '.emptyCellValue',
        snapMode: 'corner',
        snapTolerance: 15
      }).data("fromGrid", scope.grid, "fromPosition", scope.col.gridPosition);

      // remove hover effect at start of drag
      function handleStartEvent() {
        originalClass = scope.col.gridCellClass;
        if (originalClass.substring( originalClass.length - 'Static'.length, originalClass.length ) !== 'Static') {
          var staticClass = scope.cellclass + 'Static';
          scope.col.gridCellClass = staticClass;
          scope.$apply();
        }
      }

      // add hover effect back at end of drag
      function handleStopEvent() {
        scope.col.gridCellClass = originalClass;
        scope.$apply();
      }
    }
  }
});

angular.module('tatool.module').directive('droppable', function() {
  return {
    restrict: 'A',
    scope: {
      grid: '=droppable',
      griddrop: '&',
      allowdrop: "="
    },
    link: function(scope, element) {
      var jelement = $(element);

      jelement.droppable( {
        drop: handleDropEvent,
        accept: dropAllowed,
        hoverClass: "dropHover"
      });

      function dropAllowed(dropElement) {
        var targetCellid = jelement.attr('id');
        var targetCell = scope.grid.getCell(targetCellid);

        if (scope.allowdrop !== undefined && scope.allowdrop === 'yes') {
          return true;
        } else {
          // by default only allow drop on empty cells
          if(targetCell.data.stimulusValue !== undefined) {
            return false;
          } else {
            return true;
          }
        }
      }

      function handleDropEvent( event, ui ) {
        var draggable = ui.draggable;
        var fromGrid = draggable.data("fromGrid");
        var fromPosition = draggable.data("fromPosition");
        var sourceCellId = parseInt(draggable.attr('id'));
        var targetCellId = parseInt(jelement.attr('id'));
        var sourceCell = fromGrid.getCell(sourceCellId);
        var targetCell = scope.grid.getCell(targetCellId);

        scope.griddrop({'dragCell': sourceCell, 'dropCell': targetCell});

        if (fromGrid.gridId === scope.grid.gridId) {
          sourceCell.moveTo(targetCellId).refresh();
          scope.$apply();
        } else {

          var success = scope.grid.getCell(targetCellId).data.stimulusValue === undefined;

          // remove target cell in target grid
          scope.grid.removeCell(targetCellId);

          // remove source cell in source grid
          fromGrid.removeCell(sourceCellId).refresh();

          // change sourceCell to point to new grid and add at target position
          sourceCell.grid = scope.grid;
          scope.grid.addCellAtPosition(targetCellId, sourceCell).refresh();
          scope.$apply();
        }
      }
    }
  }
});