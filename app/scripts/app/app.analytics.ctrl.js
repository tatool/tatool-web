'use strict';

angular.module('tatool.app')
  .controller('AnalyticsCtrl', [ '$scope', '$sce', '$modal', '$log', 'moduleDataService', 'spinnerService', function ($scope, $sce, $modal, $log, moduleDataService, spinnerService) {

    $scope.currentModule = null;

    $scope.showEmail = 0;

    function initAnalytics() {
      // Initialize installed modules
      moduleDataService.getAllModuleAnalytics().then( function(data) {
        $scope.modules = data;

        if ($scope.modules.length === 0) {
          setAlert('info', 'No Modules found with Analytics enabled. In order for Analytics to be enabled you need to enable the Repository on your Module.');
        } else if ($scope.modules.length === 1) {
          $scope.selectedModule = {};
          $scope.selectedModule.moduleId = $scope.modules[0].moduleId;
          $scope.selectedModule.moduleName = $scope.modules[0].moduleName;
          $scope.chooseModule($scope.selectedModule);
        }
      }, function(error) {
        $log.error(error);
      });
    }

    initAnalytics();

    $scope.chooseModule = function($item) {
      startSpinner('Loading data...');
      moduleDataService.getModuleAnalytics($item.moduleId).then( function(data) {
        $scope.currentModule = data;
        stopSpinner();
      }, function(error) {
        $log.error(error);
        setAlert('danger', error);
        stopSpinner();
      });
    };

    $scope.deleteModule = function(moduleId) {

      function runDelete() {
        startSpinner('Deleting data...');
        moduleDataService.deleteModuleAnalytics(moduleId).then( function() {
          $scope.currentModule = null;
          $scope.selectedModule = {};
          initAnalytics();
          stopSpinner();
        }, function(error) {
          $log.error(error);
          stopSpinner();
        });
      }
      
      bootbox.dialog({
          message: 'Are you sure you want to delete all analytics data for <b>\'' + $scope.currentModule.moduleName + '\'</b>?',
          title: '<b>Delete Analytics Data</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: runDelete
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });
    };

    $scope.showDetails = function(user) {
      $modal.open({
        templateUrl: 'views/app/analytics_user.html',
        controller: 'AnalyticsUserCtrl',
        size: 'lg',
        resolve: {
          user: function () {
            return user;
          }
        }
      });
    };

    $scope.downloadData = function(user, module) {
      moduleDataService.getModuleAnalyticsUserData(user, module).then( function(data) {
        window.open('/data/user/' + data);
      }, function(error) {
        $log.error(error);
        setAlert('danger', error);
      });
    };

    function setAlert(alertType, alertMessage) {
      $scope.alert = {};
      $scope.alert.type = alertType;
      $scope.alert.msg = $sce.trustAsHtml(alertMessage);
      $scope.alert.visible = true;
    }

    $scope.hideAlert = function() {
      $scope.alert = {};
      $scope.alert.visible = false;
      $scope.alert.msg = '';
    };

    $scope.formatDate = function(date) {
      return new Date(date).toLocaleString();
    };

    function startSpinner(text) {
      spinnerService.spin('loadingSpinner', text);
    }

    function stopSpinner() {
      spinnerService.stop('loadingSpinner');
    }

  }]);
