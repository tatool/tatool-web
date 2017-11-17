'use strict';

UserDataService.$inject = ['$log', '$q', '$http'];

function UserDataService($log, $q, $http) {
    $log.debug('UserDataService: initialized');

    var data = {};

    // initialize user db
    data.openUsersDB = function(callback) {
      // not required for remote
      if (callback !== null) {
        callback();
      }
    };

    // get all users
    data.getUsers = function () {
      var deferred = $q.defer();

      $http.get('/api/admin/users')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // update user
    data.addUser = function(user) {
      var deferred = $q.defer();

      var userJson = JSON.parse(JSON.stringify(user));

      $http.post('/api/admin/users/' + user._id, userJson)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });
      
      return deferred.promise;
    };

    // update password
    data.updatePassword = function(user) {
      var deferred = $q.defer();

      var userJson = JSON.parse(JSON.stringify(user));

      $http.post('/api/admin/users/' + user._id + '/reset', userJson)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });
      
      return deferred.promise;
    };

    // get a user by its userName
    data.deleteUser = function(user) {
      var deferred = $q.defer();

      $http.delete('/api/admin/users/' + user._id)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    return data;

}

export default UserDataService;