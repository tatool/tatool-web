'use strict';

angular.module('tatool.module')
  .controller('dbRegressionCtrl', [ '$scope', '$log', '$window', 'service',
    function ($scope, $log, $window, service) {


    // 2. Create stimulus and set our template variables
    service.createStimulus();
    $scope.stimulusText = service.stimulusText;
    $scope.styleIsGreen = service.styleIsGreen;
    
    // 3. Show the stimulus and get the start time
    $scope.visible = true;
    $window.focus();
    service.startTime = new Date().getTime();
    service.timer.start(timerUp);

    // called when timer is up to block input and stop executable
    function timerUp() {
      processResponse('This is my answer', new Date().getTime());
    }

    // 5. Provide our executable service with the response and time of response
    function processResponse(givenResponse, endTime) {
      service.endTime = endTime;
      service.timer.stop();
      $scope.visible = false;
      service.processResponse(givenResponse);
    }

  }]);
