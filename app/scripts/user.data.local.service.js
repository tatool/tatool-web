'use strict';
/* global IDBStore */

angular.module('tatool')
  .factory('userDataLocalService', ['$log', '$q', function ($log, $q) {
    $log.debug('UserDataLocalService: initialized');

    var data = {};

    var usersDBready = false;

    // initialize user db
    data.openUsersDB = function(callback) {
      if (usersDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        data.usersDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: 'tatool_u',
          keyPath: 'userName',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Users store ready!');
            usersDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };

    // get a user by its userName
    data.getUsers = function() {
      var deferred = $q.defer();
      
      data.usersDB.getAll(
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('Login failed. There seems to be an issue with the login process.');
        });

      return deferred.promise;
    };

    // get a user by its userName
    data.getUser = function(userName) {
      var deferred = $q.defer();

      var userNameHash = Sha1.hash(userName);

      data.usersDB.get(userNameHash,
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('Login failed. There seems to be an issue with the login process.');
        });

      return deferred.promise;
    };

    // add a new user
    data.addUser = function(user) {
      var deferred = $q.defer();

      user.userName = Sha1.hash(user.userName);
      user.userPassword = Sha1.hash(user.userPassword);
      user.roles = [];
      user.roles.push('user');

      data.usersDB.put(user,
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('User could not be updated!');
        });

      return deferred.promise;
    };

    // delete a user
    data.deleteUser = function(userName) {
      var deferred = $q.defer();

      var userNameHash = Sha1.hash(userName);

      data.usersDB.remove(userNameHash,
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('User could not be removed!');
        });

      return deferred.promise;
    };

    data.getRoles = function(userName) {
      var deferred = $q.defer();

      var userNameHash = Sha1.hash(userName);

      data.usersDB.get(userNameHash,
        function(data) {
          deferred.resolve(data.roles);
        }, function() {
          deferred.reject('Error fetching user roles.');
        });

      return deferred.promise;
    };

    return data;

  }]);