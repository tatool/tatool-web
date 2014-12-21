'use strict';

tatool
  .controller('tatoolCountdownCtrl', ['$scope', 'service', function ($scope, service) {

    $scope.countdown = service.countDownFrom;

    $scope.start = function() {
      service.timer.start(countDown);
    };
    
    function countDown() {
      service.countDownFrom--;
      if (service.countDownFrom >= 1) {
        service.timer.start(countDown);
        $scope.countdown = service.countDownFrom;
      } else {
        $scope.countdown = service.goText;
        service.resetCountDown();
        service.timer.start(service.stopExecutable);
      }
    }

  }]);
