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
  data.getUsers = function() {
    var deferred = $q.defer();

    $http.get('/api/admin/users')
      .then(function onSuccess(response) {
        deferred.resolve(response.data);
      })
      .catch(function onError(error) {
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
      .then(function onSuccess(response) {
        if (response.data === 'null') {
          response.data = null;
        }
        deferred.resolve(response.data);
      })
      .catch(function onError(error) {
        $log.error(error);
        deferred.reject(error.message);
      });

    return deferred.promise;
  };

  // update password
  data.updatePassword = function(user) {
    var deferred = $q.defer();

    var userJson = JSON.parse(JSON.stringify(user));

    $http.post('/api/admin/users/' + user._id + '/reset', userJson)
      .then(function onSuccess(response) {
        if (response.data === 'null') {
          response.data = null;
        }
        deferred.resolve(response.data);
      })
      .catch(function onError(error) {
        $log.error(error);
        deferred.reject(error.message);
      });

    return deferred.promise;
  };

  // get a user by its userName
  data.deleteUser = function(user) {
    var deferred = $q.defer();

    $http.delete('/api/admin/users/' + user._id)
      .then(function onSuccess(response) {
        deferred.resolve(response.data);
      })
      .catch(function onError(error) {
        $log.error(error);
        deferred.reject(error.message);
      });

    return deferred.promise;
  };

  return data;

}

export default UserDataService;