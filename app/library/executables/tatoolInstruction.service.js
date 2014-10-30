'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', 'tatoolExecutable',
    function ($log, tatoolExecutable) {

    var TatoolInstruction = tatoolExecutable.createExecutable();

    TatoolInstruction.prototype.init = function() {
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      tatoolExecutable.stopExecutable();
    };

    return TatoolInstruction;
  }]);
