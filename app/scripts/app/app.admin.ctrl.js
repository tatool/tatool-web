'use strict';

import bootbox from 'bootbox';

AdminCtrl.$inject = ['$scope', '$q', '$http', '$log', '$timeout', '$sce', 'userDataService', 'moduleDataService', 'spinnerService'];

function AdminCtrl($scope, $q, $http, $log, $timeout, $sce, userDataService, moduleDataService, spinnerService) {

      $scope.users = [];

      $scope.roles = ['user', 'developer', 'analytics', 'admin'];

      $scope.highlightUserEmail = '';

      $scope.query = {};

      $scope.filterUser = '';

      $scope.filterProject = '';

      $scope.userPaging = {
        currentPage: 0,
        pageSize: 25
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

      function startSpinner(text) {
        spinnerService.spin('loadingSpinner', text);
      }

      function stopSpinner() {
        spinnerService.stop('loadingSpinner');
      }

      function getProjects() {
        startSpinner('Loading users...');
        moduleDataService.getAllProjects().then(function(data) {
          $scope.projects = data;
          stopSpinner();
        }, function(err) {
          stopSpinner();
          $log.error(err);
        });
      }

      function initUsers() {
        startSpinner('Loading users...');
        userDataService.getUsers().then(function(data) {
          $scope.users = data;
          $scope.userPaging.numPerPage = Math.ceil($scope.users.length / $scope.userPaging.pageSize);
          $scope.userPaging.currentPage = 0;
          stopSpinner();
        }, function(error) {
          $log.error(error);
          stopSpinner();
        });
      }

      function insertUser(email, password) {
        var user = {};
        user.email = email;
        user.password = password;
        userDataService.addUser(user).then(function() {
          setAlert('info', 'User ' + user.email + ' has been added.');
          initUsers();
        }, function(err) {
          $log.error(err);
        });
      }

      $scope.updateUser = function(user) {
        $scope.hideAlert();

        userDataService.addUser(user).then(function(data) {
          $scope.highlightUserEmail = data.data.email;
          $timeout(function() {
            $scope.highlightUserEmail = null;
          }, 500);
        }, function(err) {
          setAlert('danger', err);
          $log.error(err);
          initUsers();
        });
      };

      $scope.addUser = function() {
        $scope.hideAlert();
        var box = bootbox.dialog({
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
              callback: function() {
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

        box.bind('shown.bs.modal', function() {
          $('#email').focus();
        });

        $('#password2').keypress(function(e) {
          if (e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      function changeUserPassword(user, password) {
        user.password = password;
        userDataService.updatePassword(user).then(function() {
          $scope.highlightUserEmail = user.email;
          $timeout(function() {
            $scope.highlightUserEmail = null;
          }, 500);
        }, function(err) {
          $log.error(err);
        });
      }

      $scope.changePassword = function(user) {
        $scope.hideAlert();
        var box = bootbox.dialog({
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
              callback: function() {
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

        box.bind('shown.bs.modal', function() {
          $('#password').focus();
        });

        $('#password2').keypress(function(e) {
          if (e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      $scope.deleteUser = function(user) {
        $scope.hideAlert();

        function runDelete() {
          userDataService.deleteUser(user).then(function() {
            setAlert('info', 'User ' + user.email + ' has been deleted.');
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

      // query modules db and display
      userDataService.openUsersDB(initUsers);

      function insertProject(project) {
        var uniqueProject = true;
        var jsonParse = true;

        for (var i = 0; i < $scope.projects.length; i++) {
          if (project.name === $scope.projects[i].name && project.access === $scope.projects[i].access) {
            uniqueProject = false;
            break;
          }
        }

        project.description = (project.description) ? project.description : '';
        project.email = (project.email) ? project.email : '';

        if (uniqueProject) {
          moduleDataService.addProject(project).then(function() {
            setAlert('success', 'Project ' + project.name + ' has been added.');
            getProjects();
          }, function(err) {
            $log.error(err);
          });
        } else if (!uniqueProject) {
          setAlert('danger', 'There already exists a project with this name and access type.');
          $scope.$apply();
        } else {
          setAlert('danger', 'Unknown error');
          $scope.$apply();
        }
      }

      $scope.addProject = function() {
        $scope.hideAlert();
        var box = bootbox.dialog({
          title: '<b>Add Project</b>',
          message: '<div class="row">  ' +
            '<div class="col-md-12"> ' +
            '<form class="form-horizontal"> ' +
            '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Name</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="name" name="name" type="text" class="form-control input-md" ng-required> ' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Access</label> ' +
            '<div class="col-md-6"> ' +
            '<div class="radio"> <label for="access-public"> ' +
            '<input type="radio" name="access" id="access-public" value="public" checked> ' +
            'Public </label> ' +
            '</div>' +
            '<div class="radio"> <label for="access-private"> ' +
            '<input type="radio" name="access" id="access-private" value="private"> ' +
            'Private </label> ' +
            '</div>' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Owner (email)</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="owner" name="owner" type="text" class="form-control input-md" ng-required> ' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Description</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="description" name="description" type="text" class="form-control input-md"> ' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Executables (JSON)</label> ' +
            '<div class="col-md-8"> ' +
            '<textarea id="executables" name="executables" class="form-control input-sm" rows="10"></textarea>' +
            '<small><b>Format:</b> [ { "customType" : "executable1", "description": "Small executable description", "customProperties": [ { "propertyName": "booleanProperty", "propertyType": "Boolean" } ] }, <br>{ "customType" : "executable2" } ]</small>' +
            '</div> ' +
            '</div> ' +
            '</div> ' +
            '</form> </div> </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function() {
                var project = {};
                project.name = $('#name').val();
                project.access = $('input[name=\'access\']:checked').val();
                project.email = $('#owner').val();
                project.description = $('#description').val();
                project.executables = $('#executables').val().replace(/\r?\n/g, '');

                if (!hasValidProjectExecutables(project)) {
                  alert('The executables are not in proper JSON format. Please correct and try again.');
                  return false;
                } else if (!project.name || project.name === '' || !project.access || project.access === '' || !project.email || project.email === '') {
                  alert('Invalid project name or access type.');
                  return false;
                } else {
                  insertProject(project);
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

        box.bind('shown.bs.modal', function() {
          $('#name').focus();
        });

        $('#description').keypress(function(e) {
          if (e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      $scope.deleteProject = function(project) {
        $scope.hideAlert();

        function runDelete() {
          moduleDataService.deleteProject(project).then(function() {
            setAlert('info', 'Project ' + project.name + ' has been deleted.');
            getProjects();
          }, function(err) {
            $log.error(err);
          });
        }

        bootbox.dialog({
          message: 'Are you sure you want to delete the project <b>\'' + project.name + '\'</b>?<br>All files in the project folder will be deleted.',
          title: '<b>Delete Project</b>',
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

      function updateProject(project) {
        moduleDataService.addProject(project).then(function() {
            setAlert('success', 'Project ' + project.name + ' has been saved.');
            getProjects();
          }, function(err) {
            $log.error(err);
          });
      }

      function hasValidProjectExecutables(project) {
        var jsonParse = true;
        try {
          project.executables = (project.executables) ? JSON.parse(project.executables) : project.executables;
        } catch (e) {
          jsonParse = false;
        }
        return jsonParse;
      }

      $scope.editProject = function(project) {

        var cloneOfProject = JSON.parse(JSON.stringify(project));
        $scope.hideAlert();
        var box = bootbox.dialog({
          title: '<b>Edit Project</b>',
          message: 
          '<div class="row">  ' +
            '<div class="col-md-12"> ' +
            '<form class="form-horizontal"> ' +
            '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Name</label> ' +
            '<div class="col-md-6"> ' +
            '<p class="form-control-static"><b>' + cloneOfProject.name + '</b></p>' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Access</label> ' +
            '<div class="col-md-6"> ' +
            '<p class="form-control-static"><b>' + cloneOfProject.access + '</b></p>' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Owner (email)</label> ' +
            '<div class="col-md-6"> ' +
            '<p class="form-control-static"><b>' + cloneOfProject.email + '</b></p>' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Description</label> ' +
            '<div class="col-md-6"> ' +
            '<input id="description" name="description" type="text" class="form-control input-md" value="' + cloneOfProject.description + '"> ' +
            '</div> ' +
            '</div> ' +

          '<div class="form-group"> ' +
            '<label class="col-md-4 control-label" for="name">Executables (JSON)</label> ' +
            '<div class="col-md-8"> ' +
            '<textarea id="executables" name="executables" class="form-control input-sm" rows="10">' + JSON.stringify(cloneOfProject.executables) + '</textarea>' +
            '<small><b>Format:</b> [ { "customType" : "executable1", "description": "Small executable description", "customProperties": [ { "propertyName": "booleanProperty", "propertyType": "Boolean" } ] }, <br>{ "customType" : "executable2" } ]</small>' +
            '</div> ' +
            '</div> ' +
            '</div> ' +
            '</form> </div> </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function() {
                cloneOfProject.description = $('#description').val();
                cloneOfProject.executables = $('#executables').val().replace(/\r?\n/g, '');
                if (hasValidProjectExecutables(cloneOfProject)) {
                  updateProject(cloneOfProject);
                } else {
                  alert('The executables are not in proper JSON format. Please correct and try again.');
                  return false;
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

        box.bind('shown.bs.modal', function() {
          $('#description').focus();
        });

        $('#description').keypress(function(e) {
          if (e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      // loading all projects from tatool
      moduleDataService.openModulesDB(null, 'user', getProjects);


      $scope.setUserFilter = function() {
        if ($scope.query.user.length >= 2) {
          $scope.filterUser = $scope.query.user;
        } else {
          $scope.filterUser = '';
        }
      };

      $scope.removeUserFilter = function() {
        $scope.query.user = '';
        $scope.filterUser = '';
        $scope.userPaging.currentPage = 0;
      };

      $scope.$watch('query.user', function() {
        $scope.userPaging.numPerPage = Math.ceil($scope.users.length / $scope.userPaging.pageSize);
        $scope.userPaging.currentPage = 0;
      }, true);

      $scope.setProjectFilter = function() {
        if ($scope.query.project.length >= 2) {
          $scope.filterProject = $scope.query.project;
        } else {
          $scope.filterProject = '';
        }
      };

      $scope.removeProjectFilter = function() {
        $scope.query.project = '';
        $scope.filterProject = '';
      };

}

export default AdminCtrl;