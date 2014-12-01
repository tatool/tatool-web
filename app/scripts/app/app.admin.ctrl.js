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

      $scope.addUser = function() {
        $scope.hideAlert();
        var box =bootbox.dialog({
          title: '<b>Add User</b>',
          message: '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                    '<form class="form-horizontal"> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Email</label> ' +
                    '<div class="col-md-5"> ' +
                    '<input id="email" name="email" type="email" class="form-control input-md" ng-required ng-model="usermail"> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Password</label> ' +
                    '<div class="col-md-5"> ' +
                    '<input id="password" name="password" type="password" class="form-control input-md" ng-required> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Retype Password</label> ' +
                    '<div class="col-md-5"> ' +
                    '<input id="password2" name="password2" type="password" class="form-control input-md" required> ' +
                    '</div> ' +
                    '</div> ' +
                    '</form> </div> </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function () {
                var re = /\S+@\S+\.\S+/;
                var email = $('#email').val();
                var password = $('#password').val();
                var password2 = $('#password2').val();
                if (!email || email === '' || !re.test(email) || password !== password2 || password === '') {
                  setAlert('danger', 'Invalid email or password.');
                  $scope.$apply();
                } else {
                  insertUser(email, password);
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

        box.bind('shown.bs.modal', function(){
          $('#email').focus();
        });

        $('#password2').keypress(function(e) {
          if(e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      function insertUser(email, password) {
        var user = {};
        user.email = email;
        user.password = password;
        userDataService.addUser(user).then( function() {
          setAlert('info', 'User '+ user.email + ' has been added.');
          initUsers();
        }, function(err) {
          $log.error(err);
        });
      }

      $scope.changePassword = function(user) {
        $scope.hideAlert();
        var box =bootbox.dialog({
          title: '<b>Change Password</b>',
          message: '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                    '<form class="form-horizontal"> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Email</label> ' +
                    '<div class="col-md-5"> ' +
                    '<p class="form-control-static"><b>' + user.email + '</b></p>' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Password</label> ' +
                    '<div class="col-md-5"> ' +
                    '<input id="password" name="password" type="password" class="form-control input-md" ng-required> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Retype Password</label> ' +
                    '<div class="col-md-5"> ' +
                    '<input id="password2" name="password2" type="password" class="form-control input-md" required> ' +
                    '</div> ' +
                    '</div> ' +
                    '</form> </div> </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function () {
                var password = $('#password').val();
                var password2 = $('#password2').val();
                if (password !== password2 || password === '') {
                  setAlert('danger', 'Invalid password or not matching.');
                  $scope.$apply();
                } else {
                  changeUserPassword(user, password);
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

        box.bind('shown.bs.modal', function(){
          $('#password').focus();
        });

        $('#password2').keypress(function(e) {
          if(e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      function changeUserPassword(user, password) {
        user.password = password;
        userDataService.updatePassword(user).then( function() {
          $scope.highlightUserEmail = user.email;
          $timeout(function() { $scope.highlightUserEmail = null; }, 500);
        }, function(err) {
          $log.error(err);
        });
      }

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
          message: 'Are you sure you want to delete the user <b>\'' + user.email + '\'</b>?<br>All modules associated with this user will also be deleted.',
          title: '<b>Delete User</b>',
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

      $scope.setUserFilter = function() {
        if ($scope.query.length >= 2) {
          $scope.filterUser = $scope.query;
        } else {
          $scope.filterUser = '';
        }
      };

      $scope.removeUserFilter = function() {
        $scope.query = '';
        $scope.filterUser = '';
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

    }]);
