'use strict';

GridServiceFactory.$inject = ['$log', '$rootScope', 'executableUtils'];

function GridServiceFactory($log, $rootScope, executableUtils) {

    // Define our executable service constructor which will be called once for every instance
    var gridServiceFactory = {};

    gridServiceFactory.createService = function(rows, cols, gridId, stimuliPath, defaultVisible = false) {
      var grid = new Grid(gridId);
      grid.resize(rows, cols);
      grid.stimuliPath = stimuliPath ? stimuliPath : '';
      grid.displayVisible = defaultVisible;
      return grid;
    };

    function Grid(gridId) {

      this.cellsObject = {};
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

      this.initCell = function(data) {
        var cell = new Cell(this);
        cell.data = data;
        if (data.gridPosition !== undefined) {
          cell.gridPosition = data.gridPosition;
        }
        if (data.gridCellSize !== undefined) {
          cell.gridCellSize = data.gridCellSize;
        }
        if (data.gridCellClass !== undefined) {
          cell.gridCellClass = data.gridCellClass;
        }
        if (data.gridAllowDrag !== undefined) {
          cell.gridAllowDrag = data.gridAllowDrag;
        }
        if (data.gridAllowDrop !== undefined) {
          cell.gridAllowDrop = data.gridAllowDrop;
        }
        if (data.gridCellHeight !== undefined) {
          cell.gridCellHeight = data.gridCellHeight;
        }
        if (data.gridCellWidth !== undefined) {
          cell.gridCellWidth = data.gridCellWidth;
        }
        // prepare image source
        if (data.stimulusValueType === 'image') {
          var resource = this.stimuliPath;
          resource.resourceName = data.stimulusValue;
          var imgSrc = executableUtils.getResourcePath(resource);
          cell.stimulusImage = imgSrc;
        }
        return cell;
      };

      this.createCell = function(data) {
        var cell = this.initCell(data);
        return cell;
      };

      this.addCell = function(cell) {
        var newCell = {};

        if (cell.data === undefined) {
          newCell = this.initCell(cell);
        } else {
          newCell = cell;
        }

        if(this.cellsObject[newCell.gridPosition] === undefined) {
          this.cellsObject[newCell.gridPosition] = newCell;
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t add cell as there is already a cell at position ' + cell.gridPosition + '.');
          return null;
        }
      };

      this.addCellAtPosition = function(position, cell) {
        var newCell = {};
        if (cell instanceof Cell) {
          newCell = this.initCell(cell);
        } else {
          newCell = cell;
        }

        position = parseInt(position);

        newCell.gridPosition = position;

        return this.addCell(newCell);
      };

      this.getCell = function(position) {
        if (this.cellsObject[position] === undefined && position <= this.numCells) {
          return {gridPosition: position, data: {}};
        } else {
          return this.cellsObject[position];
        }
      };

      this.getCells = function() {
        var allCells = [];
        for (var property in this.cellsObject) {
          if (this.cellsObject.hasOwnProperty(property)) {
            allCells.push(this.cellsObject[property]);
          }
        }
        return allCells;
      };

      this.getNumCells = function() {
        var numCells = 0;
        for (var property in this.cellsObject) {
          if (this.cellsObject.hasOwnProperty(property)) {
            numCells++;
          }
        }
        return numCells;
      };

      this.removeCell = function(position) {
        delete this.cellsObject[position];
        return this;
      };

      this.moveCell = function(fromPosition, toPosition) {
        if (toPosition === fromPosition) {
          $log.error('[Error][TatoolGrid]: Can\'t move cell as target position is same as origin position ' + fromPosition + '.');
          return null;
        }

        if (this.cellsObject[fromPosition] !== undefined) {
          var fromCell = this.cellsObject[fromPosition];
          fromCell.gridPosition = toPosition;
          this.cellsObject[toPosition] = fromCell;
          delete this.cellsObject[fromPosition];
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t move empty cell at position ' + fromPosition);
          return null;
        }
      };

      this.swapCell = function(position1, position2) {
        if (this.cellsObject[position1] !== undefined && this.cellsObject[position2] !== undefined) {
          var cell1 = this.cellsObject[position1];
          var newPosition1 = cell1.gridPosition;
          var cell2 = this.cellsObject[position2];
          var newPosition2 = cell2.gridPosition;
          cell1.gridPosition = newPosition2;
          cell2.gridPosition = newPosition1;
          this.cellsObject[newPosition1] = cell2;
          this.cellsObject[newPosition2] = cell1;
          return this;
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t swap empty cell at position ' + position1 + ' or ' + position2);
          return null;
        }
      };

      this.clear = function() {
        this.cellsObject = {};
        return this;
      };

      this.refresh = function() {
        this.refreshCells();
        this.refreshGrid();
      };

      this.redraw = function() {
        this.refreshCells();
        this.initGrid();
      };

      this.refreshCells = function() {
        this.cells.length = 0;
        for (var property in this.cellsObject) {
          if (this.cellsObject.hasOwnProperty(property)) {
            this.cells.push(this.cellsObject[property]);
          }
        }
      };
    }

    /*
      Tatool Grid: Cell Definition
    */
    function Cell(grid) {
      this.grid = grid;
      this.gridPosition = 0;
      this.data = {};

      this.gridCellSize = '';
      this.gridCellHeight = '';
      this.gridCellWidth = '';
      this.gridCellClass = '';

      this.remove = function() {
        if (this.gridPosition === 0) {
          return null;
        }

        this.grid.removeCell(this.gridPosition);
        this.gridPosition = 0;

        return this.grid;
      };

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
            newCol = oldCol - numCells;
            newRow = oldRow;
            break;
          case 'right':
            newCol = oldCol + numCells;
            newRow = oldRow;
            break;
          case 'up':
            newCol = oldCol;
            newRow = oldRow - numCells;
            break;
          case 'down':
            newCol = oldCol;
            newRow = oldRow + numCells;
            break;
          default:
            $log.error('[Error][TatoolGrid]: No direction given for move.');
            return null;
        }

        if(newCol >= 0 && newRow >= 0 && newCol < this.grid.cols && newRow < this.grid.rows) {
          newPosition = (this.grid.cols * newRow) + (newCol + 1);
        } else {
          $log.error('[Error][TatoolGrid]: Can\'t move cell from position ' + this.gridPosition + ', as new position is outside of grid.');
          return null;
        }
        
        return this.grid.moveCell(this.gridPosition, newPosition);
      };

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
            newCol = oldCol - numCells;
            newRow = oldRow;
            break;
          case 'right':
            newCol = oldCol + numCells;
            newRow = oldRow;
            break;
          case 'up':
            newCol = oldCol;
            newRow = oldRow - numCells;
            break;
          case 'down':
            newCol = oldCol;
            newRow = oldRow + numCells;
            break;
          default:
            $log.error('[Error][TatoolGrid]: No direction given for getNext.');
            return null;
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

        toPosition = parseInt(toPosition);

        if (this.gridPosition !== toPosition) {
          this.grid.moveCell(this.gridPosition, toPosition);
        }
        return this.grid;
      };

    }

    // Return our service object
    return gridServiceFactory;

}

export default GridServiceFactory;