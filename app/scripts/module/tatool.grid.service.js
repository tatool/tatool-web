'use strict';

angular.module('tatool.module')
  .factory('tatoolGridService', [ function () {

    // Define our executable service constructor which will be called once for every instance
    var tatoolGridService = {};

    tatoolGridService.prototype.createGrid = function() {
      return new Grid();
    };

    function Grid() {
      this.cells = [];

      this.addCell = function(cell) {
        console.log(cell);
      };
    }
    // Return our service object
    return tatoolGridService;

  }]);
