'use strict';

UserService.$inject = ['$window', '$rootScope', 'moduleDataService', 'trialDataService'];

function UserService($window, $rootScope, moduleDataService, trialDataService) {

  // creates a new user sessions
  this.createSession = function (userName, token, roles, code) {
    this.userName = userName;
    this.authenticated = true;
    this.roles = roles;
    this.code = code;
    $window.sessionStorage.setItem('userName', userName);
    $window.sessionStorage.setItem('roles', roles);
    $window.sessionStorage.setItem('token', token);
    $window.sessionStorage.setItem('code', code);
    trialDataService.closeTrialsDB();
    $rootScope.$broadcast('login');
  };

  // destroys a user session
  this.destroySession = function () {
    this.userName = null;
    this.authenticated = false;
    this.roles = null;
    $window.sessionStorage.removeItem('userName');
    $window.sessionStorage.removeItem('roles');
    $window.sessionStorage.removeItem('token');
    $window.sessionStorage.removeItem('code');
    trialDataService.closeTrialsDB();
    $rootScope.$broadcast('logout');
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

  // gets the userName
  this.getUserName = function() {
    if (!this.userName) {
      this.userName = $window.sessionStorage.getItem('userName');
    }
    return this.userName ? this.userName : null;
  };

  // gets the user code
  this.getUserCode = function() {
    if (!this.code) {
      this.code = $window.sessionStorage.getItem('code');
    }
    return this.code ? this.code : null;
  };

  return this;
}

export default UserService;