'use strict';

angular.module('tatool.auth')
  .service('userService', ['$window', '$q', 'messageService', 'dataService', function ($window, $q, messageService, dataService) {

  // creates a new user sessions
  this.createSession = function (sessionId, userName) {
    this.sessionId = sessionId;
    this.userName = userName;
    $window.sessionStorage.setItem('sessionId', sessionId);
    $window.sessionStorage.setItem('userName', userName);
  };

  // destroys a user session
  this.destroy = function () {
    this.sessionId = null;
    this.userName = null;
    $window.sessionStorage.removeItem('sessionId');
    $window.sessionStorage.removeItem('userName');
  };

  // gets the current session
  this.getSessionId = function() {
    if (!this.sessionId) {
      this.sessionId = $window.sessionStorage.getItem('sessionId');
      this.userName = $window.sessionStorage.getItem('userName');
    }
    return this.sessionId > 0;
  };

  // gets the current username
  this.getUserName = function() {
    if (!this.userName) {
      this.sessionId = $window.sessionStorage.getItem('sessionId');
      this.userName = $window.sessionStorage.getItem('userName');
    }
    return this.userName ? this.userName : null;
  };

  // adds a new user to the user db and returns a promise. If user exists already rejects the returned promise
  this.addUser = function(credentials) {
    var deferred = $q.defer();

    var user = credentials;

    function onReady() {
      dataService.getUser(user.userName).then(function(data) {
        if (data !== undefined) {
          deferred.reject('The email address entered is already registered.');
        } else {
          // add new user
          dataService.addUser(user).then(function(data) {
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

    dataService.openUsersDB(onReady);

    return deferred.promise;
  };

  // authenticates user against user db and returns a promise
  this.authUser = function(credentials) {
    var deferred = $q.defer();

    var userPassword = Sha1.hash(credentials.userPassword);

    function onReady() {
      dataService.getUser(credentials.userName).then(function(data) {
        if (data !== undefined) {
          if (userPassword === data.userPassword) {
            deferred.resolve();
          } else {
            deferred.reject('Login failed. Make sure you entered your information correctly.');
          }
        } else {
          deferred.reject('Login failed. Make sure you entered your information correctly.');
        }
      }, function(error) {
        deferred.reject(error);
      });
    }

    dataService.openUsersDB(onReady);

    return deferred.promise;
  };

  return this;
}]);