'use strict';

angular.module('tatool.module')
  .factory('visualUpdatingExecutable', [ '$rootScope', 'tatoolExecutable', 'db', 'timerService', 'tatoolGridService', 
    function ($rootScope, tatoolExecutable, db, timerService, tatoolGridService) {  

    // Define our executable service constructor which will be called once for every instance
    var VisualUpdatingExecutable = tatoolExecutable.createExecutable();

    VisualUpdatingExecutable.prototype.init = function() {

      // set the data path for our animal images
      this.dataPath = 'data/';

      // create  new a tatoolGrid
      this.myGrid = tatoolGridService.createGrid(2, 4, 'animalGrid');

      // add cells and refresh afterwards
      this.myGrid.addCellAtPosition(5, {stimulusValue: '#ccc', stimulusValueType: 'square', gridAllowDrop: 'all', animal: 'None'});
      this.myGrid.addCellAtPosition(3, {stimulusValue: 'AB', stimulusValueType: 'text', animal: 'None'});
      this.myGrid.addCellAtPosition(2, {stimulusValue: 'bird_96x96.png', stimulusValueType: 'image', animal: 'Birdy', gridAllowDrag: 'yes'});
      this.myGrid.addCellAtPosition(4, {stimulusValue: 'rhino_96x96.png', stimulusValueType: 'image', animal: 'Rhino'});
      this.myGrid.addCellAtPosition(6, {stimulusValue: 'bear_96x96.png', stimulusValueType: 'image', animal: 'Bear'});
      this.myGrid.addCellAtPosition(8, {stimulusValue: '#ccc', stimulusValueType: 'circle', gridAllowDrop: 'yes', animal: 'None'});

      var myCell = this.myGrid.createCell({stimulusValue: 'penguin_96x96.png', stimulusValueType: 'image', animal: 'Penguin'});
      this.myGrid.addCellAtPosition(1, myCell).refresh();

    };

    // Return our service object
    return VisualUpdatingExecutable;

  }]);
