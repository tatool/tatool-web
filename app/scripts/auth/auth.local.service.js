'use strict';

angular.module('tatool.auth')
  .factory('authLocalService', ['$q', 'userService', 'userDataService', 'messageService', function($q, userService, userDataService, messageService) {

  var authService = {};
 
  // login
  authService.login = function (credentials) {
    var deferred = $q.defer();

    var userPassword = Sha1.hash(credentials.userPassword);

    function onReady() {
      userDataService.getUser(credentials.userName).then(function(data) {
        if (data !== undefined) {
          if (userPassword === data.userPassword) {
            userService.createSession(credentials.userName, 1);
            deferred.resolve();
          } else {
            userService.destroySession();
            deferred.reject('Login failed. Make sure you entered your information correctly.');
          }
        } else {
          userService.destroySession();
          deferred.reject('Login failed. Make sure you entered your information correctly.');
        }
      }, function(error) {
        userService.destroySession();
        deferred.reject(error);
      });
    }

    userDataService.openUsersDB(onReady);

    return deferred.promise;
  };

  // logout
  authService.logout = function () {
    userService.destroySession();
    return true;
  };

  // register
  authService.register = function (credentials) {
    var deferred = $q.defer();

    var user = credentials;

    function onReady() {
      userDataService.getUser(user.userName).then(function(data) {
        if (data !== undefined) {
          deferred.reject('The email address is already registered.');
        } else {
          // add new user
          userDataService.addUser(user).then(function(data) {
            messageService.setMessage({ type: 'success', msg: 'Registration successful. You can go ahead and login now.'});
            deferred.resolve(data);
          }, function(error) {
            deferred.reject(error);
          });
        }
      }, function(error) {
        deferred.reject(error);
      });
    }

    userDataService.openUsersDB(onReady);

    return deferred.promise;
  };
 
  // check whether user is authenticated
  authService.isAuthenticated = function () {
    return userService.isAuthenticated();
  };
  
  return authService;

}]);