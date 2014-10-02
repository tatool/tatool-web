'use strict';

angular.module('tatool.auth')
  .service('userService', ['$window', '$q', 'messageService', function ($window, $q, messageService) {

  // creates a new user sessions
  this.create = function (sessionId, userName) {
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

  // adds a new user to the local user db
  this.addUser = function(userInfo) {
    var userDB = new PouchDB('_u');

    var deferred = $q.defer();

    var userName = Sha1.hash(userInfo.userName);
    var userPassword = Sha1.hash(userInfo.userPassword);

    function map(doc, emit) {
      if (doc._id === userName) {
        emit(doc._id);
      }
    }

    userDB.query(map, {reduce: false}, function(err, response) {
      if (!response || response.rows.length === 0) {
        userDB.put({_id : userName, cred: userPassword }, function(err, response) {
          if (!err) {
            messageService.setMessage({ type: 'success', msg: 'Registration successful. You can go ahead and login now.'});
            deferred.resolve(response);
          }
        });
      } else {
        deferred.reject('The email address entered is already registered.');
      }
    });

    return deferred.promise;
  };

  // authenticates user against user db
  this.authUser = function(credentials) {
    var userDB = new PouchDB('_u');
    var deferred = $q.defer();

    var userName = Sha1.hash(credentials.userName);
    var userPassword = Sha1.hash(credentials.userPassword);

    userDB.get(userName,
      function(err, doc) {
        if (!err) {
          if (userPassword === doc.cred) {
            deferred.resolve();
          } else {
            deferred.reject('Login failed. Make sure you enter your information correctly.');
          }
        } else {
          deferred.reject('Login failed. Make sure you enter your information correctly.');
        }
      });

    return deferred.promise;
  };

  return this;
}]);