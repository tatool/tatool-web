'use strict';

tatool
  .factory('tatoolGridExecutable', [ 'tatoolExecutable', 'timerService', 'tatoolGridService',
    function (tatoolExecutable, timerService, tatoolGridService) {

    // Define our executable service constructor
    var TatoolGridExecutable = tatoolExecutable.createExecutable();

    TatoolGridExecutable.prototype.init = function() {
      // create non visual timers to be used by the controller
      this.messageTimer = timerService.createTimer(2000, false, this);
      this.endTimer = timerService.createTimer(2500, false, this);

      // set the data path for our animal images
      this.dataPath = '../../packages/test/data/';

      // create a new tatoolGrid with 2 rows and 4 cols
      this.myGrid = tatoolGridService.createGrid(2, 4, 'animalGrid');
    };

    TatoolGridExecutable.prototype.createStimulus = function() {
      // clear grid
      this.myGrid.clear();

      // the points variable helps us to keep score
      this.points = 0;

      // add cells and refresh afterwards
      this.myGrid.addCellAtPosition(2, {stimulusValue: 'bird_96x96.png', stimulusValueType: 'image', animal: 'Birdy', animalSize: 1});
      this.myGrid.addCellAtPosition(4, {stimulusValue: 'rhino_96x96.png', stimulusValueType: 'image', animal: 'Rhino', animalSize: 4});
      this.myGrid.addCellAtPosition(6, {stimulusValue: 'bear_96x96.png', stimulusValueType: 'image', animal: 'Bear', animalSize: 3});

      var myCell = this.myGrid.createCell({stimulusValue: 'penguin_96x96.png', stimulusValueType: 'image', animal: 'Penguin', animalSize: 2});
      this.myGrid.addCellAtPosition(1, myCell).refresh();
    };

    TatoolGridExecutable.prototype.stopExecution = function() {
      tatoolExecutable.stopExecutable();
    };

    // Return our executable service object
    return TatoolGridExecutable;
  }]);
