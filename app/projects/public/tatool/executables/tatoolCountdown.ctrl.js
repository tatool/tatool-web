'use strict';

tatool
  .controller('tatoolCountdownCtrl', ['$scope', 'service', function ($scope, service) {

    $scope.countdown = service.countDownFrom;

    $scope.start = function() {
      service.timer.start(countDown);
    };
    
    function countDown() {
      service.countDownFrom--;
      $scope.countdown = service.countDownFrom;
      if (service.countDownFrom >= 1) {
        service.timer.start(countDown);
      } else {
        service.resetCountDown();
        service.timer.start(service.stopExecutable());
      }
    }

  }]);
