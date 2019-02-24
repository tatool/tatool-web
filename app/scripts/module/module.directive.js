'use strict';

/* global KeyCodes */
/* global videojs */

import KeyCodes from './util/keycodes.js';
import videojs from 'video.js';
import {Howl, Howler} from 'howler';

Tatool.$inject = ['$timeout', 'executableUtils', 'contextService'];
TatoolInput.$inject = ['$log', '$templateCache', '$compile', '$timeout', 'executableUtils'];
TatoolKey.$inject = ['$log', '$sce', 'executableUtils'];
TatoolStimulus.$inject = ['$log', '$templateCache', '$timeout', '$q', 'cfgModule', 'executableUtils'];
TatoolGrid.$inject = ['$log', '$templateCache', 'cfgModule', 'executableUtils'];

/**
  <tatool> 
  Main directive used to initiate start of executable after all directives have loaded.
**/
function Tatool($timeout, executableUtils, contextService) {
  return {
    restrict: 'E',
    priority: Number.MIN_SAFE_INTEGER, // execute as last directive
    link: function($scope) {
      // trigger the start function in the executable controller
      if ('start' in $scope) {
        $timeout($scope.start);
      } else {
        var currentExecutable = contextService.getProperty('currentExecutable');
        executableUtils.fail('Executable Controller with name \'' + currentExecutable.name + '\' is missing the mandatory \'start\' method.');
      }
    }
  };
}


/**
  <tatool-input> 
  Directive to configure user input.
**/
function TatoolInput($log, $templateCache, $compile, $timeout, executableUtils) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      service: '=',             // expects a stimulus object provided by the inputServiceFactory      
      userinput: '&'            // method called on user input (mouse/keyboard)
    },
    controller: ['$scope', function($scope) {
      this.addKey = function(keyCode, value) {
        $scope.service._registerStaticKey(keyCode, value);
      };

      this.addTextKey = function(keyCode, value, textInputId) {
        $scope.service._registerStaticTextKey(keyCode, value, textInputId);
      };

      // process user input (key/mouse)
      this.clickInput = function(keyCode, timing, event) {
        if ($scope.inputEnabled) {
          if ($scope.service.registeredKeyInputs[keyCode].textInput) {
            var textInput = $('#tatoolInputText').val();
            $('#tatoolInputText').val('');
            if (textInput) {
              $scope.service.registeredKeyInputs[keyCode].givenResponse = textInput;
            } else {
              $scope.service.registeredKeyInputs[keyCode].givenResponse = '';
            }
          }
          $scope.userinput({'input': $scope.service.registeredKeyInputs[keyCode], 'timing': timing, '$event': event});
        }
      };

      this.getStimuliPath = function() {
        return $scope.service.stimuliPath;
      };
    }],
    link: function (scope, element, attr, ctrl) {

      // hide and disable by default
      scope.inputEnabled = false;
      scope.show = scope.service.displayVisible;
      $('#tatoolInputText').attr('disabled', true);

      // add key directives for dynamically added keys in correct order
      scope.service.refreshKeys = function() {
        element.children(':first').children('[dynamic]').remove();
        angular.forEach(scope.service.keyInputOrder, function(keyCode) {
          var value = scope.service.registeredKeyInputs[keyCode];
          if (value.dynamic) {
            var label = (value.labelType === 'text' && value.label) ? ' label="' + value.label + '"' : '';
            var image = (value.labelType === 'image' && value.label) ? ' image="' + value.label + '"' : '';
            var hide = (value.hide) ? ' hide' : '';
            var keyEl = angular.element('<tatool-key code="'+ value.keyCode +'" response="'+ value.givenResponse + '"' + label + image + hide + ' dynamic="true"></tatool-key>');
            element.children(':first').append(keyEl);
            $compile(keyEl)(scope);
          }
        });
      };

      // remove dynamically added keys
      scope.service.removeInputKey = function(keyCode) {
        element.children(':first').children('[code=' + keyCode + ']').remove();
        scope.service._removeDynamicKey(keyCode);
        return scope.service;
      };

      // remove all dynamically added keys
      scope.service.removeAllInputKeys = function() {
        element.children(':first').children().remove();
        scope.service._removeAllKeys();
        return scope.service;
      };

      // listen to keyPress event broadcasted by mainCtrl
      var watcher = scope.$on('keyPress', function(event, keyEvent) {
        if (scope.inputEnabled) {
          if (scope.service.registeredKeyInputs[keyEvent.which]) {
            ctrl.clickInput(keyEvent.which, keyEvent.keyPressTime, event);
          }
        }
      });

      // show all keys
      scope.service.show = function() {
        scope.show = true;
        return executableUtils.getTiming();
      };

      // hide all keys
      scope.service.hide = function() {
        scope.show = false;
        return executableUtils.getTiming();
      };

      // enable input
      scope.service.enable = function() {
        scope.inputEnabled = true;
        $('#tatoolInputText').attr('disabled', false);
        $timeout(function() { $('#tatoolInputText').focus(); }, 0);
        return executableUtils.getTiming();
      };

      // disable input
      scope.service.disable = function() {
        scope.inputEnabled = false;
        $('#tatoolInputText').attr('disabled', true);
        return executableUtils.getTiming();
      };

      scope.service.refreshKeys();

      element.on('$destroy', function() {
        watcher();
      });
    },
    template: '<div id="tatoolInput" ng-transclude ng-show="show"></div>'
  };
}


/**
  <tatool-key> 
  Directive to configure key input.
**/
function TatoolKey($log, $sce, executableUtils) {
  return {
    restrict: 'E',
    scope: {},
    require: '^tatoolInput',
    link: function (scope, element, attr, tatoolInputCtrl) {
      // register key with tatoolInput if not dynamically added
      if (!attr.dynamic) {
        tatoolInputCtrl.addKey(attr.code, attr.response);
      }

      // hide input if configured
      if (attr.hide !== undefined) {
        element.css('display','none');
      }

      // generate the display label for the key
      if (attr.label !== undefined) {
        scope.key = $sce.trustAsHtml(attr.label);
      } else if (attr.image !== undefined) {
        var resource = tatoolInputCtrl.getStimuliPath();
        resource.resourceName = attr.image;
        var imgSrc = executableUtils.getResourcePath(resource);
        scope.key = $sce.trustAsHtml('<img src="' + imgSrc + '" class="img">');
      } else {
        var internalValue = attr.code;
        if (internalValue.substring(0,5) === 'Digit') {
          internalValue = internalValue.slice(-1);
        } else if (internalValue.substring(0,6) === 'Numpad') {
          internalValue = internalValue.slice(-1);
        } else {
          internalValue = attr.code;
        }

        switch (internalValue) {
          case 'ArrowLeft' :
            internalValue = '<i class="fa fa-caret-left fa-2x" style="margin-left:-7px;margin-top:12px"></i>';
            break;
          case 'ArrowRight' :
            internalValue = '<i class="fa fa-caret-right fa-2x" style="margin-right:-7px;margin-top:12px"></i>';
            break;
          case 'ArrowUp' :
            internalValue = '<i class="fa fa-caret-up fa-2x" style="margin-top:9px"></i>';
            break;
          case 'ArrowDown' :
            internalValue = '<i class="fa fa-caret-down fa-2x" style="margin-top:12px"></i>';
            break;
        }
        scope.key = $sce.trustAsHtml(internalValue);
      }

      scope.clickInput = function($event) {
        var timing = executableUtils.getTiming();
        tatoolInputCtrl.clickInput(KeyCodes[attr.code], timing, $event);
      };
    },
    template: '<div class="tatoolKey" ng-click="clickInput($event)" ng-bind-html="key"></div>'
  };
}


/**
  <tatool-text> 
  Directive to configure text input.
**/
function TatoolText() {
  return {
    restrict: 'E',
    scope: {},
    require: '^tatoolInput',
    link: function (scope, element, attr, tatoolInputCtrl) {
      tatoolInputCtrl.addTextKey('Enter', '', 'tatoolInputText');
      $('#tatoolInputText').focus();

      // keep focus
      $(document).on('click', function() {
        $('#tatoolInputText').focus();
      });
    },
    template: '<input type="text" class="textInput" id="tatoolInputText">'
  };
}



/**
  <tatool-stimulus> 
  Directive to display a stimulus.
**/
function TatoolStimulus($log, $templateCache, $timeout, $q, cfgModule, executableUtils) {
  return {
    restrict: 'E',
    scope: {
      service: '=',             // expects a stimulus object provided by the stimulusServiceFactory
      stimulusclick: '&'        // function to call on mouse click on stimulus
    },
    link: function (scope, element) {

      // hide by default
      scope.show = scope.service.displayVisible;
      scope.stimulus = scope.service;
      var videoPlayer = null;
      var audioPlayer = null;

      scope.service.show = function() {
        scope.show = true;
        scope.service.playAudio();
        return executableUtils.getTiming();
      };

      scope.service.hide = function() {
        scope.show = false;
        scope.service.stopAudio();
        return executableUtils.getTiming();
      };

      scope.service.playAudio = function(onEnd) {
        if (scope.stimulus.data.stimulusValueType.startsWith('audio')) {
          audioPlayer = new Howl({src: scope.stimulus.stimulusAudio, onend: onEnd});
          audioPlayer.play();
        }
        return executableUtils.getTiming();
      };

      scope.service.stopAudio = function() {
        if (scope.stimulus.data.stimulusValueType.startsWith('audio') && audioPlayer !== null) {
          audioPlayer.stop();
        }
        return executableUtils.getTiming();
      };

      // initialize video player
      scope.service.initVideoPlayer = function(options) {
        var deferred = $q.defer();
        $timeout(function() { 
          videoPlayer = videojs('videoStimulus', options);
          videoPlayer.src(scope.stimulus.stimulusVideo.toString());
          deferred.resolve(videoPlayer);
        }, 0);
        return deferred.promise;
      };

      scope.service.playVideo = function() {
        if (scope.stimulus.data.stimulusValueType === 'video' && videoPlayer !== null) {
          videoPlayer.play();
        } else {
          console.error('The video player has not been initialized. Call the initPlayer() method before using the player (returns a promise).');
        }
      };

      scope.service.pauseVideo = function() {
        videoPlayer.pause();
      };

      // return video player to allow direct use of video.js api
      scope.service.getVideoPlayer = function() {
        return videoPlayer;
      };

      scope.stimulusClickEvent = function($event, stimulus) {
        var timing = executableUtils.getTiming();
        if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        scope.stimulusclick({'stimulus': stimulus, 'timing': timing, '$event': $event});
      };

      element.on('$destroy', function() {
        if (videoPlayer !== null) {
          videoPlayer.dispose();
        }
      });
    },
    template: $templateCache.get('tatoolStimulus.html')
  };
}


/**
  <tatool-grid> 
  Directive creating a grid used to display stimuli.
**/
function TatoolGrid($log, $templateCache, cfgModule, executableUtils) {
  return {
    restrict: 'E',
    scope: {
      service: '=',                // expects a tatool-grid object provided by the gridServiceFactory
      gridspacing: '@',         // defines the table style [collapse|separate|n]
      cellclass: '@',           // defines default class used for grid cells
      cellwidth: '@',           // defines default width of a grid cell
      cellheight: '@',          // defines default height of a grid cell
      hideemptycells: '@',      // hides [yes] or shows [] empty grid cells
      disablehover: '@',        // disables [yes] or enables [] hover effect on grid cells (expects a static css class)
      allowdrag: '@',           // defines whether drag feature is enabled [yes] or not [] by default
      allowdrop: '@',           // defines whether drop feature is enabled [yes|all] or not [] by default
      gridclick: '&',           // function to call on mouse click on a specific grid cell
      griddrop: '&',            // function to call on drop on a specific grid cell
      gridmouseenter: '&',      // function to call on mouse enter on a specific grid cell
      gridmouseleave: '&'       // function to call on mouse leave on a specific grid cell
    },
    link: function (scope, element, attr) {

      // hide by default
      scope.show = scope.service.displayVisible;

      // set table styling
      scope.tableStyle = {};
      if (scope.gridspacing !== undefined) {
        if (scope.gridspacing === 'collapse') {
          scope.tableStyle['border-collapse'] = 'collapse';
        } else if (scope.gridspacing === 'separate') {
          scope.tableStyle['border-collapse'] = 'separate';
        } else {
          scope.tableStyle['border-collapse'] = 'separate';
          scope.tableStyle['border-spacing'] = scope.gridspacing + 'px';
        }
      } else {
        scope.tableStyle['border-collapse'] = 'separate';
        scope.tableStyle['border-spacing'] = '15px';
      }
      
      // initialize grid UI
      scope.cells = scope.service.cells;   // grid given to directive
      var coordinates = {};             // used as a shortcut object to transform position to row/col
      var cellsUsed = [];               // holds the cells which contain user content

      scope.service.show = function() {
        scope.show = true;
        //element.css("visibility","visible");
        return executableUtils.getTiming();
      };

      scope.service.hide = function() {
        scope.show = false;
        //element.css("visibility","hidden");
        return executableUtils.getTiming();
      };

      // initialize grid
      scope.service.initGrid = function() {

        scope.gridCells = [];
        for(var i = 0; i < scope.service.rows; i++) {
          var row = [];
          scope.gridCells.push(row);
          for(var j = 1; j <= scope.service.cols; j++) {
            var position = (scope.service.cols * i) + j;

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
        scope.service.coordinates = coordinates;
      };

      // init cell with values
      var initCell = function(cell) {

        // set cellsize (priority: cell/grid/default)
        if (cell.gridCellHeight === undefined || cell.gridCellHeight === '') {
          cell.gridCellHeight = scope.cellheight;
        }
        if (cell.gridCellWidth === undefined || cell.gridCellWidth === '') {
          cell.gridCellWidth = scope.cellwidth;
        }

        // try to assign appropriate size automatically depending on viewport size
        if (cell.gridCellHeight === undefined || cell.gridCellHeight === '') {
          var viewportHeight = $(window).height();
          cell.gridCellHeight = (viewportHeight/2) / scope.service.rows;
        }
        if (cell.gridCellWidth === undefined || cell.gridCellWidth === '') {
          var viewportWidth = $(window).width();
          cell.gridCellWidth = (viewportWidth/2) / scope.service.cols;
        }

        // procoess built-in stimulus value types (circle/square)
        if(cell.data.stimulusValueType === 'circle' || cell.data.stimulusValueType === 'square') {
          if (cell.data.stimulusValue === undefined) {
            cell.data.stimulusValue = '#666666';
          }
        }
 
        // set cellclass (priority: cell/grid/default)
        if (cell.gridCellClass === undefined || cell.gridCellClass === '') {
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

        // set default draganddrop behavior
        if (scope.allowdrag !== undefined) {
          cell.gridAllowDrag = scope.allowdrag;
        } else {
          if (cell.gridAllowDrag === undefined) {
            cell.gridAllowDrag = 'no';
          }
        }

        // set default draganddrop behavior
        if (scope.allowdrop !== undefined) {
          cell.gridAllowDrop = scope.allowdrop;
        } else {
          if (cell.gridAllowDrop === undefined) {
            cell.gridAllowDrop = 'no';
          }
        }

        // create override styles for cell size and cellValue
        var cellOverrideStyle = {
          'width':cell.gridCellWidth + 'px',
          'height':cell.gridCellHeight + 'px',
          'min-width':cell.gridCellWidth + 'px',
          'min-height':cell.gridCellHeight + 'px'
          //'max-width':cell.gridCellWidth + 'px',
          //'max-height':cell.gridCellHeight + 'px'
        };
        var cellValueOverrideStyle = {
          'background-color':cell.data.stimulusValue
        };
        cell.gridCellOverrideStyle = cellOverrideStyle;
        cell.gridCellValueOverrideStyle = cellValueOverrideStyle;

        return cell;
      };

      // initialize grid
      scope.service.initGrid();

      // init cell with values
      scope.service.refreshGrid = function() {
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

      scope.gridClickEvent = function($event, cell) {
        var timing = executableUtils.getTiming();
        if ($event.timeStamp < cfgModule.MIN_EPOCH_MS) {
          $event.timeStamp = new Date().getTime();
        }
        scope.gridclick({'cell': cell, 'timing': timing, '$event': $event});
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

      });

    },
    template: $templateCache.get('tatoolGrid.html')
  };
}


function TatoolDrag() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var jelement = $(element);
      var originalClass;

      // remove hover effect at start of drag
      var handleStartEvent = function () {
        originalClass = scope.col.gridCellClass;
        if (originalClass.substring( originalClass.length - 'Static'.length, originalClass.length ) !== 'Static') {
          var staticClass = scope.cellclass + 'Static';
          scope.col.gridCellClass = staticClass;
          scope.$apply();
        }
      };

      // add hover effect back at end of drag
      var handleStopEvent = function () {
        scope.col.gridCellClass = originalClass;
        scope.$apply();
      };

      // add jquery draggable
      if (attrs.allowdragcell === 'yes') {
        jelement.draggable( {
          addClasses: false,
          helper: 'clone',
          opacity: 0.45,
          start: handleStartEvent,
          stop: handleStopEvent,
          cursor: 'move',
          zIndex: 5000,
          revert: 'invalid',
          snap: '.emptyCellValue',
          snapMode: 'corner',
          snapTolerance: 15
        }).data('fromGrid', scope.service, 'fromPosition', scope.col.gridPosition);
      }
    }
  };
}

function TatoolDrop() {
  return {
    restrict: 'A',
    scope: {
      grid: '=tatoolDrop',        // expects a tatool-grid object provided by the gridServiceFactory 
      griddrop: '&',              // function to call on drop on a specific grid cell
      allowdropcell: '@'          // defines whether drop feature is enabled [yes|all] or not [] for this cell
    },
    link: function(scope, element) {
      var jelement = $(element);

      // accept function to decide where cell can be dropped
      function dropAllowed() {
        var targetCellid = jelement.attr('id');
        var targetCell = scope.grid.getCell(targetCellid);

        if (scope.allowdropcell === 'all') {
          return true;
        } else if (scope.allowdropcell === 'yes'){
          // by default only allow drop on empty cells
          if(targetCell.data.stimulusValue !== undefined) {
            return false;
          } else {
            return true;
          }
        } else {
          return false;
        }
      }

      // handle drop event of cell
      function handleDropEvent( event, ui ) {
        var draggable = ui.draggable;
        var fromGrid = draggable.data('fromGrid');
        var sourceCellId = parseInt(draggable.attr('id'));
        var targetCellId = parseInt(jelement.attr('id'));
        var sourceCell = fromGrid.getCell(sourceCellId);
        var targetCell = scope.grid.getCell(targetCellId);

        if (fromGrid.gridId === scope.grid.gridId) {
          sourceCell.moveTo(targetCellId).refresh();
          scope.$apply();
        } else {
          // remove target cell in target grid
          scope.grid.removeCell(targetCellId);

          // remove source cell in source grid
          fromGrid.removeCell(sourceCellId).refresh();

          // change sourceCell to point to new grid and add at target position
          sourceCell.grid = scope.grid;
          scope.grid.addCellAtPosition(targetCellId, sourceCell.data).refresh();
          scope.$apply();
        }

        if (scope.griddrop !== undefined) {
          scope.griddrop({'dragCell': sourceCell, 'dropCell': targetCell});
        }
      }

      // add jquery droppable
      jelement.droppable( {
        addClasses: false,
        drop: handleDropEvent,
        accept: dropAllowed,
        hoverClass: 'dropHover'
      });
    }
  };
}

export {
  Tatool,
  TatoolInput,
  TatoolKey,
  TatoolText,
  TatoolStimulus,
  TatoolGrid,
  TatoolDrag,
  TatoolDrop
}