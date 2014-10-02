'use strict';

angular.module('tatool.auth')
  .factory('authService', ['$http', '$q', 'userService', 'dataService',  function($http, $q, userService, dataService) {

  var authService = {};
 
  // login
  // TODO: Login adapters
  authService.login = function (credentials) {
    var deferred = $q.defer();

    userService.authUser(credentials).then(function() {
      userService.create(1, credentials.userName);
      dataService.initUserDB();
      deferred.resolve();
    }, function(error) {
      deferred.reject(error);
    });
    
    return deferred.promise;
  };

  // logout
  authService.logout = function () {
    userService.destroy();
    return true;
  };
 
  // check whether current user is authenticated
  authService.isAuthenticated = function () {
    return userService.getSessionId();
  };
  
  return authService;

}]);