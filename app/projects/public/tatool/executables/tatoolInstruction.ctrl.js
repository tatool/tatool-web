'use strict';

tatool
  .controller('tatoolInstructionCtrl', ['$scope', '$log', '$state', '$window', 'service', 'userService', 'moduleService',
    function ($scope, $log, $state, $window, service, userService, moduleService) {
    
    $window.focus();

    var inputEnabled = true;

    // initialize template variables
    $scope.userName = userService.getUserName() ? userService.getUserName() : '';
    $scope.moduleName = moduleService.getModuleName() ? moduleService.getModuleName() : '';
    $scope.moduleAuthor = moduleService.getModuleAuthor() ? moduleService.getModuleAuthor() : '';
    $scope.moduleVersion = moduleService.getModuleVersion() ? moduleService.getModuleVersion() : '';
    $scope.sessionNr = moduleService.getMaxSessionId() ? moduleService.getMaxSessionId() : '';
    $scope.moduleProperties = moduleService.getModuleProperties() ? moduleService.getModuleProperties() : {};

    // initialize the instruction at startup to point to first page
    $scope.currentIndex = 0;
    $scope.urls = service.pages;
    $scope.currentPage = $scope.urls[$scope.currentIndex];

    // listen to user input in the form of key press
    $scope.$on('keyPress', function(event, keyEvent) {
      if (inputEnabled) {
        if(keyEvent.which === 37) { // Left Arrow
          $scope.go(-1);
        } else if (keyEvent.which === 39) { // Right Arrow
          $scope.go(1);
        }
      }
    });

    // simple pagination
    $scope.go = function(index) {
      if (index > 0 && $scope.currentIndex < ($scope.urls.length - 1)) {
        $scope.currentIndex += index;
        $scope.currentPage = $scope.urls[$scope.currentIndex];
      } else if (index < 0 && $scope.currentIndex > 0) {
        $scope.currentIndex += index;
        $scope.currentPage = $scope.urls[$scope.currentIndex];
      } else if (index > 0 && $scope.currentIndex === ($scope.urls.length - 1)) {
        inputEnabled = false;
        service.stopExecutable();
      }
    };

    // jump to a specific page
    $scope.jump = function(index) {
      $scope.currentIndex = index;
      $scope.currentPage = $scope.urls[$scope.currentIndex];
    };

  }]);
