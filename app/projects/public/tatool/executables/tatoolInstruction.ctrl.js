'use strict';

tatool
  .controller('tatoolInstructionCtrl', ['$scope', 'service', 'moduleService',
    function ($scope, service, moduleService) {

    var PROJECTS_PATH = '../../projects/';

    // initialize template variables
    var sessionNr = moduleService.getMaxSessionId();
    $scope.moduleName = moduleService.getModuleName() ? moduleService.getModuleName() : '';
    $scope.moduleAuthor = moduleService.getModuleAuthor() ? moduleService.getModuleAuthor() : '';
    $scope.moduleVersion = moduleService.getModuleVersion() ? moduleService.getModuleVersion() : '';
    $scope.sessionNr = sessionNr ? sessionNr : '';
    $scope.moduleProperties = moduleService.getModuleProperties() ? moduleService.getModuleProperties() : {};
    $scope.sessionProperties = moduleService.getSessionProperties(sessionNr) ? moduleService.getSessionProperties(sessionNr) : {};

    $scope.inputService = service.inputService;

    $scope.showDigitPagination = service.showDigitPagination;

    $scope.currentPage = '';
    $scope.currentImage = '';
    $scope.showPagination = false;

    // start instruction
    $scope.start = function() {
      $scope.currentIndex = 0;
      service.inputService.hide();
      service.inputService.enable();

      if (service.pages && service.pages.propertyValue.length > 0) {
        $scope.urls = service.pages.propertyValue;
        service.refreshCache().then(changeInstruction(0));
        showPagination();
      } else if (service.images && service.images.propertyValue.length > 0) {
        $scope.urls = service.imageUrls;
        $scope.currentImage = $scope.urls[$scope.currentIndex];
        showPagination();
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
        changeInstruction($scope.currentIndex);
      } else if (index < 0 && $scope.currentIndex > 0) {
        $scope.currentIndex += index;
        changeInstruction($scope.currentIndex);
      } else if (index > 0 && $scope.currentIndex === ($scope.urls.length - 1)) {
        service.inputService.disable();
        service.stopExecutable();
      }
    };

    // jump to specific page
    $scope.jump = function(index) {
      $scope.currentIndex = index;
      changeInstruction($scope.currentIndex);
    };

    function showPagination() {
      $scope.showPagination = true;
    }

    function getImagePath(project) {
      return PROJECTS_PATH + project.access + '/' + project.name + '/instructions';
    }

    function changeInstruction(index) {
      if (service.pages && service.pages.propertyValue.length > 0) {
        $scope.currentPage = $scope.urls[index].resourceName;
      } else if (service.images && service.images.propertyValue.length > 0) {
        $scope.currentImage = $scope.urls[index];
      } else {
        console.error('Error: missing pages or images Property.');
      }
    }

  }]);
