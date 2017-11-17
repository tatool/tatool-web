'use strict';

/* global Date */

InviteCtrl.$inject = ['$scope', '$q', '$uibModalInstance', '$sce', 'module', 'moduleDataService'];

function InviteCtrl($scope, $q, $uibModalInstance, $sce, module, moduleDataService) {

      $scope.user = {};
      $scope.module = module;
      $scope.inputError = false;
      $scope.alert = {};

      $scope.ok = function () {
        $uibModalInstance.close();
      };

      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };

      $scope.formatDate = function(date) {
        return new Date(Date.parse(date)).toLocaleString();
      };

      $scope.inviteUser = function() {
        hideAlert();
        var email = $scope.user.email;
        $scope.user.email = '';
        $scope.inputError = false;

        if (!email) {
          $scope.inputError = true;
        } else {
          var exists = false;
          if (module.invites) {
            for (var i = 0; i < module.invites.users.length; i++) {
              if (email === module.invites.users[i].email) {
                exists = true;
                break;
              }
            }
          }

          if (exists) {
            setAlert('danger', 'The user is already invited.');
          } else {
            var user = { email: email };
            moduleDataService.inviteUser(module.moduleId, user).then(function(data) {
              module = data;
              $scope.module = data;
            }, function(error) {
              setAlert('danger', error);
            });
          }
        }
      };

      $scope.removeUser = function(user) {
        hideAlert();
        var userData = { email: user.email };
        moduleDataService.removeInvite(module.moduleId, userData).then(function(data) {
            module = data;
            $scope.module = data;
          }, function(error) {
            setAlert('danger', error);
          });
      };

      var setAlert = function(alertType, alertMessage) {
        $scope.alert = {};
        $scope.alert.type = alertType;
        $scope.alert.msg = $sce.trustAsHtml(alertMessage);
        $scope.alert.visible = true;
      };

      var hideAlert = function() {
        $scope.alert = {};
        $scope.alert.visible = false;
        $scope.alert.msg = '';
      };

      $scope.hideAlert = hideAlert;

}

export default InviteCtrl;
