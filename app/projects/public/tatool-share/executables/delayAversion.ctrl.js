'use strict';

tatool
  .controller('delayAversionCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.gridService = service.gridService;

    // start execution
    $scope.start = function() {

      // start counting down
      service.gridService.clear();
      countDown();
    };

    function countDown() {
      service.gridService.clear();
      service.showCountdown();
      service.gridService.refresh();
      service.gridService.show();
      if (service.fastCountdown >= 1) {
        service.fastCountdown--;
      }
      if (service.slowCountdown >= 1) {
        service.slowCountdown--;
      }
      service.timerCountdown.start(countDown);
    }

    $scope.userClick = function(cell, timing, $event) {
      if (cell.data.type) {
        service.gridService.hide();
        service.processResponse(cell.data.type, timing);
        service.gridService.clear().refresh();
        service.turns--;
        service.resetCountdown();
        service.stopExecution();
      }
    };

  }]);
