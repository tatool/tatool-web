'use strict';

AuthService.$inject = ['$http', '$q', '$log', 'userService', 'messageService'];

function AuthService($http, $q, $log, userService, messageService) {

  var authService = {};

  // login
  authService.login = function(credentials) {
    var deferred = $q.defer();
    $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.userName + ':' + credentials.userPassword);
    $http.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8';

    $http.get('/api/login')
      .then(function(response) {
        userService.createSession(credentials.userName, response.data.token, response.data.roles, response.data.code);
        deferred.resolve('success');
      }, function(error) {
        // Erase the session if the user fails to log in
        console.log(error);
        userService.destroySession();
        if (error.data.verify) {
          deferred.reject(error.data.message + ' If you have not received an email, you can <a href="/#!/verify">resend</a> the verification email.');
        } else {
          deferred.reject('Login failed. Make sure you entered your information correctly.');
        }
      });

    return deferred.promise;
  };

  // logout
  authService.logout = function() {
    userService.destroySession();
    return true;
  };

  // register
  authService.register = function(credentials) {
    var deferred = $q.defer();

    $http.post('/api/register', credentials)
      .then(function(response) {
        messageService.setMessage({
          type: 'success',
          msg: 'Registration successful. A <b>verification email</b> has been sent. In order to activate your account, you need to click the link provided in the email.'
        });
        deferred.resolve('success');
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  // check whether user is authenticated
  authService.isAuthenticated = function() {
    return userService.isAuthenticated();
  };

  authService.getRoles = function() {
    var deferred = $q.defer();

    $http.get('/api/user/roles')
      .then(function(response) {
        deferred.resolve(response.data.roles);
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });
    return deferred.promise;
  };

  authService.resendVerification = function(user) {
    var deferred = $q.defer();

    $http.post('/user/verify/resend', user)
      .then(function(response) {
        deferred.resolve('success');
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  authService.sendPasswordReset = function(user) {
    var deferred = $q.defer();

    $http.post('/user/reset', user)
      .then(function(response) {
        deferred.resolve('success');
      }, function(error) {
        $log.error(error);
        if (error.data.verify) {
          deferred.reject(error.data.message + ' If you have not received an email, you can <a href="/#!/verify">resend</a> the verification email.');
        } else {
          deferred.reject(error.data.message);
        }
      });

    return deferred.promise;
  };

  authService.verifyResetToken = function(token) {
    var deferred = $q.defer();

    $http.get('/user/resetverify/' + token)
      .then(function(response) {
        deferred.resolve(response.data);
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  authService.resetPassword = function(user) {
    var deferred = $q.defer();

    $http.post('/user/reset/' + user.token, user)
      .then(function(response) {
        deferred.resolve('success');
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  authService.verifyCaptcha = function(captcha) {
    var deferred = $q.defer();

    $http.post('/user/captcha', {
        'response': captcha
      })
      .then(function(response) {
        deferred.resolve('success');
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  authService.publicLogin = function(moduleId, extid) {
    var deferred = $q.defer();

    $http.get('/public/login/' + moduleId + '?extid=' + extid)
      .then(function(response) {
        userService.createSession(response.data.code.toString(), response.data.token, response.data.roles, response.data.code);
        deferred.resolve(response.data.module);
      }, function(error) {
        $log.error(error);
        deferred.reject(error.data.message);
      });

    return deferred.promise;
  };

  return authService;

}

export default AuthService;