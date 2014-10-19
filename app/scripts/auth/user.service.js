'use strict';

angular.module('tatool.auth')
  .service('userService', [ '$window', 'moduleDataService', 'trialDataService', function ($window, moduleDataService, trialDataService) {

  // creates a new user sessions
  this.createSession = function (userName, token) {
    this.userName = userName;
    this.authenticated = true;
    $window.sessionStorage.setItem('userName', userName);
    $window.sessionStorage.setItem('token', token);
    moduleDataService.closeModulesDB();
    trialDataService.closeTrialsDB();
  };

  // destroys a user session
  this.destroySession = function () {
    this.userName = null;
    this.authenticated = false;
    $window.sessionStorage.removeItem('userName');
    $window.sessionStorage.removeItem('token');
    moduleDataService.closeModulesDB();
    trialDataService.closeTrialsDB();
  };

  // is authenticated
  this.isAuthenticated = function() {
    if (!this.userName) {
      this.userName = $window.sessionStorage.getItem('userName');
    }
    if (this.userName) {
      this.authenticated = true;
    }
    return this.authenticated ? this.authenticated : false;
  };

  // gets the current username
  this.getUserName = function() {
    if (!this.userName) {
      this.userName = $window.sessionStorage.getItem('userName');
    }
    return this.userName ? this.userName : null;
  };

  return this;
}]);