'use strict';

tatool
  .controller('tatoolInstructionCtrl', ['$scope', '$log', '$state', '$window', 'service', 'userService', 'moduleService',
    function ($scope, $log, $state, $window, service, userService, moduleService) {
    
    $window.focus();

    // initialize template variables
    $scope.userName = userService.getUserName() ? userService.getUserName() : '';
    $scope.moduleName = moduleService.getModuleName() ? moduleService.getModuleName() : '';
    $scope.moduleAuthor = moduleService.getModuleAuthor() ? moduleService.getModuleAuthor() : '';
    $scope.moduleVersion = moduleService.getModuleVersion() ? moduleService.getModuleVersion() : '';
    $scope.sessionNr = moduleService.getMaxSessionId() ? moduleService.getMaxSessionId() : '';
    $scope.moduleProperties = moduleService.getModuleProperties() ? moduleService.getModuleProperties() : {};

    $scope.input = service.input;

    // start instruction
    $scope.start = function() {
      if (service.pages && service.pages.length > 0) {
        $scope.currentIndex = 0;
        $scope.urls = service.pages;
        $scope.currentPage = $scope.urls[$scope.currentIndex];
        service.input.hide();
        service.input.enable();
      } else {
        service.stopExecutable();
      }
    };

    // capture user input
    $scope.inputAction = function(input, timing, event) {
      if(input.givenResponse === 'back') { // Left Arrow
        $scope.go(-1);
      } else if (input.givenResponse === 'next') { // Right Arrow
        $scope.go(1);
      }
    };

    // simple pagination
    $scope.go = function(index) {
      if (index > 0 && $scope.currentIndex < ($scope.urls.length - 1)) {
        $scope.currentIndex += index;
        $scope.currentPage = $scope.urls[$scope.currentIndex];
      } else if (index < 0 && $scope.currentIndex > 0) {
        $scope.currentIndex += index;
        $scope.currentPage = $scope.urls[$scope.currentIndex];
      } else if (index > 0 && $scope.currentIndex === ($scope.urls.length - 1)) {
        service.input.disable();
        service.stopExecutable();
      }
    };

    // jump to specific page
    $scope.jump = function(index) {
      $scope.currentIndex = index;
      $scope.currentPage = $scope.urls[$scope.currentIndex];
    };

  }]);
