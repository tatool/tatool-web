'use strict';

angular.module('tatool.app')
  .controller('AdminCtrl', ['$scope', '$q', '$http', '$log', '$timeout', '$sce', 'userDataService',
    function ($scope, $q, $http, $log, $timeout, $sce, userDataService) {

      $scope.users = [];

      $scope.roles = ['user', 'developer', 'researcher', 'admin'];

      $scope.highlightUserEmail = '';

      $scope.updateUser = function(user) {
        $scope.hideAlert();

        userDataService.addUser(user).then( function(data) {
          $scope.highlightUserEmail = data.data.email;
          $timeout(function() { $scope.highlightUserEmail = null; }, 500);
        }, function(err) {
          $log.error(err);
        });
      };

      $scope.deleteUser = function(user) {
        $scope.hideAlert();

        function runDelete() {
          userDataService.deleteUser(user).then( function() {
            setAlert('info', 'User '+ user.email + ' has been deleted.');
            initUsers();
          }, function(err) {
            $log.error(err);
          });
        }
        
        bootbox.dialog({
          message: 'Are you sure you want to delete the user <b>\'' + user.email + '\'</b>?',
          title: '<b>Tatool</b>',
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

      function initUsers() {
        userDataService.getUsers().then( function(data) {
          $scope.users = data;
        }, function(error) {
          $log.error(error);
        });
      }

      // query modules db and display
      userDataService.openUsersDB(initUsers);

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

    }]);
