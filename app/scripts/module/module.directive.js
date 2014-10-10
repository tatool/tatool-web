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

      if(scope.rows === undefined || scope.cols === undefined || scope.cells === undefined) {
        $log.error('Missing attributes on tatool-grid directive. Required attributes: rows, cols, cells');
      } else {

        scope.$watchCollection('cells', function() {
          scope.gridCells = [];

          // creating grid and adding cells
          for(var i = 0; i < scope.rows; i++) {
            var row = [];
            scope.gridCells.push(row);
            for(var j = 1; j <= scope.cols; j++) {
              var position = (scope.cols * i) + j;
              var cell = {gridPosition: position};

              for (var k = 0; k < scope.cells.length; k++) {
                if (scope.cells[k].gridPosition === position) {
                  cell = scope.cells[k];
                }
              }

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

              // create override styles
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
              row.push(cell);
            }
          }

        });
        
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
      }

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