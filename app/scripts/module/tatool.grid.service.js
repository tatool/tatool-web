'use strict';

angular.module('tatool.module')
  .factory('tatoolGridService', [ '$log', '$rootScope', function ($log, $rootScope) {

    // Define our executable service constructor which will be called once for every instance
    var tatoolGridService = {};

    tatoolGridService.createGrid = function(rows, cols, gridId) {
      var grid = new Grid(gridId);
      grid.resize(rows, cols);
      return grid;
    };

    function Grid(gridId) {
      var cellsObject = {};
      this.cells = [];
      this.gridId = gridId ? gridId : 'default';
      this.rows = 0;
      this.cols = 0;
      this.numCells = this.rows * this.cols;

      this.resize = function(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.numCells = this.rows * this.cols;
        return this;
      };

      this.createCell = function(data) {
        var cell = new Cell(this);
        cell.data = data;
        if (data.gridPosition !== undefined) {
          cell.gridPosition = data.gridPosition;
        }
        return cell;
      };

      this.addCell = function(cell) {
        var newCell = {};

        if (cell.data === undefined) {
          newCell = new Cell(this);
          newCell.data = cell;
          newCell.gridPosition = cell.gridPosition;
        } else {
          newCell = cell;
        }

        if(cellsObject[newCell.gridPosition] === undefined) {
          cellsObject[newCell.gridPosition] = newCell;
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t add cell as there is already a cell at position ' + cell.gridPosition + '.');
          return null;
        }
      };

      this.addCellAtPosition = function(position, cell) {
        var newCell = {};
        if (!cell instanceof Cell) {
          newCell = new Cell(this);
          newCell.data = cell;
        } else {
          newCell = cell;
        }

        newCell.gridPosition = position;
        return this.addCell(newCell);
      };

      this.getCell = function(position) {
        if (cellsObject[position] === undefined && position <= this.numCells) {
          return {gridPosition: position, data: {}};
        } else {
          return cellsObject[position];
        }
      };

      this.removeCell = function(position) {
        delete cellsObject[position];
        return this;
      };

      this.moveCell = function(fromPosition, toPosition) {
        if (toPosition == fromPosition) {
          $log.error('[Error][TatoolGrid]: Can\'t move cell as target position is same as origin position ' + fromPosition + '.');
          return null;
        }
        if (cellsObject[fromPosition] !== undefined) {
          var fromCell = cellsObject[fromPosition];
          fromCell.gridPosition = toPosition;
          cellsObject[toPosition] = fromCell;
          delete cellsObject[fromPosition];
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t move empty cell at position ' + fromPosition);
          return null;
        }
      };

      this.swapCell = function(position1, position2) {
        if (cellsObject[position1] !== undefined && cellsObject[position2] !== undefined) {
          var cell1 = cellsObject[position1];
          var position1 = cell1.gridPosition;
          var cell2 = cellsObject[position2];
          var position2 = cell2.gridPosition;
          cell1.gridPosition = position2;
          cell2.gridPosition = position1;
          cellsObject[position1] = cell2;
          cellsObject[position2] = cell1;
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t swap empty cell at position ' + position1 + ' or ' + position2);
          return null;
        }
      };

      this.clear = function() {
        cellsObject = {};
        return this;
      };

      this.refresh = function() {
        this.refreshCells();
        $rootScope.$broadcast('tatool-grid:refresh', this.gridId);
      };

      this.redraw = function() {
        this.refreshCells();
        $rootScope.$broadcast('tatool-grid:redraw', this.gridId);
      };

      this.refreshCells = function() {
        this.cells.length = 0;
        for (var property in cellsObject) {
          if (cellsObject.hasOwnProperty(property)) {
            this.cells.push(cellsObject[property]);
          }
        }
      };
    }

    function Cell(grid, options) {
      this.grid = grid;
      this.gridPosition = 0;
      this.data = {};

      this.gridCellSize;
      this.gridCellClass;

      this.remove = function() {
        if (this.gridPosition === 0) {
          return null;
        }

        grid.removeCell(this.gridPosition);
        this.gridPosition = 0;
        return this.grid;
      }

      this.move = function(direction, numCells) {
        if (this.gridPosition === 0) {
          return null;
        }

        var newCol, newRow, newPosition;
        var oldCol = this.grid.coordinates[this.gridPosition].col;
        var oldRow = this.grid.coordinates[this.gridPosition].row;

        if (numCells === undefined) {
          numCells = 1;
        }

        switch (direction) {
          case 'left':
            var newCol = oldCol - numCells;
            var newRow = oldRow;
            break;
          case 'right':
            var newCol = oldCol + numCells;
            var newRow = oldRow;
            break;
          case 'up':
            var newCol = oldCol;
            var newRow = oldRow - numCells;
            break;
          case 'down':
            var newCol = oldCol;
            var newRow = oldRow + numCells;
            break;
          default:
            $log.error('[Error][TatoolGrid]: No direction given for move.');
            return null;
            break;
        }

        if(newCol >= 0 && newRow >= 0 && newCol < this.grid.cols && newRow < this.grid.rows) {
          newPosition = (this.grid.cols * newRow) + (newCol + 1);
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t move cell from position ' + this.gridPosition + ', as new position is outside of grid.');
          return null;
        }
        
        return this.grid.moveCell(this.gridPosition, newPosition);
      }

      this.getNext = function(direction, numCells) {
        if (this.gridPosition === 0) {
          return null;
        }

        var newCol, newRow, newPosition;
        var oldCol = this.grid.coordinates[this.gridPosition].col;
        var oldRow = this.grid.coordinates[this.gridPosition].row;

        if (numCells === undefined) {
          numCells = 1;
        }

        switch (direction) {
          case 'left':
            var newCol = oldCol - numCells;
            var newRow = oldRow;
            break;
          case 'right':
            var newCol = oldCol + numCells;
            var newRow = oldRow;
            break;
          case 'up':
            var newCol = oldCol;
            var newRow = oldRow - numCells;
            break;
          case 'down':
            var newCol = oldCol;
            var newRow = oldRow + numCells;
            break;
          default:
            $log.error('[Error][TatoolGrid]: No direction given for getNext.');
            return null;
            break;
        }

        if (newCol >= 0 && newRow >= 0 && newCol < this.grid.cols && newRow < this.grid.rows) {
          newPosition = (this.grid.cols * newRow) + (newCol + 1);
        } else {
          return null;
        }

        return this.grid.getCell(newPosition);
      };

      this.moveTo = function(toPosition) {
        if (this.gridPosition === 0) {
          return null;
        }
        
        if (this.gridPosition != toPosition) {
          grid.moveCell(this.gridPosition, toPosition);
        }
        return this.grid;
      }

    }

    // Return our service object
    return tatoolGridService;

  }]);