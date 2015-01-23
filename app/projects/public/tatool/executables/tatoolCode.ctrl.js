'use strict';

tatool
  .controller('tatoolCodeCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.inputService = service.inputService;
    $scope.inputText = service.inputText;

    // Start execution
    $scope.start = function() {
      service.inputService.enable();
      service.inputService.show();
    };

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      var result = service.processResponse(input.givenResponse);

      if (result) {
        $scope.isError = false;
        service.inputService.hide();
        service.stopExecution();
      } else {
        $scope.isError = true;
        service.inputService.enable();
      }
    };

  }]);
