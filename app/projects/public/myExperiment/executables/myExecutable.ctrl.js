tatool.controller('myExecutableCtrl', [ '$scope', 'service',
  function ($scope, service) {
    
    $scope.start = function() {
      // our code goes here
      service.stopExecution();
    }

    // our custom methods go here

  }]);