'use strict';

tatool
  .controller('dbRegressionCtrl', [ '$scope', '$log', '$window', 'service',
    function ($scope, $log, $window, service) {

    $scope.stimulusText = service.stimulusText;
    $scope.styleIsGreen = service.styleIsGreen;

    $scope.start = function() {
      // 2. Create stimulus and set our template variables
      service.createStimulus();
      $window.focus();
    
      // 3. Show the stimulus and get the start time
      $scope.visible = true;
      service.startTime = service.timer.start(timerUp);
    };

    // called when timer is up to block input and stop executable
    function timerUp(endTime) {
      processResponse('This is my answer', endTime);
    }

    // 5. Provide our executable service with the response and time of response
    function processResponse(givenResponse, endTime) {
      service.endTime = endTime;
      service.timer.stop();
      $scope.visible = false;
      service.processResponse(givenResponse);
    }

  }]);
