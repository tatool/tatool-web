'use strict';

AuthService.$inject = ['$http', '$q', '$log', 'userService', 'messageService'];

function AuthService($http, $q, $log, userService, messageService) {

  var authService = {};
 
  // login
  authService.login = function (credentials) {
    var deferred = $q.defer();
    $http.defaults.headers.common.Authorization = 'Basic ' + btoa(credentials.userName + ':' + credentials.userPassword);
    $http.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8';
    $http.get('/api/login')
      .success(function (data) {
        userService.createSession(credentials.userName, data.token, data.roles, data.code);
        deferred.resolve('success');
      })
      .error(function (error) {
        // Erase the session if the user fails to log in
        $log.error(error);
        userService.destroySession();
        if (error.verify) {
          deferred.reject(error.message + ' If you have not received an email, you can <a href="/#/verify">resend</a> the verification email.');
        } else {
          deferred.reject('Login failed. Make sure you entered your information correctly.');
        }
      });

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
    $http.post('/api/register', credentials)
      .success(function () {
        messageService.setMessage({ type: 'success', msg: 'Registration successful. A <b>verification email</b> has been sent. In order to activate your account, you need to click the link provided in the email.'});
        deferred.resolve('success');
      })
      .error(function (error) {
        $log.error(error.message);
        deferred.reject(error.message);
      });

    return deferred.promise;
  };
 
  // check whether user is authenticated
  authService.isAuthenticated = function () {
    return userService.isAuthenticated();
  };

  authService.getRoles = function () {
    var deferred = $q.defer();
    $http.get('/api/user/roles')
      .success(function (userRoles) {
        deferred.resolve(userRoles.roles);
      })
      .error(function (error) {
        $log.error(error);
        deferred.reject(error.message);
      });
    return deferred.promise;
  };

  authService.resendVerification = function(user) {
    var deferred = $q.defer();
    $http.post('/user/verify/resend', user)
      .success(function () {
        deferred.resolve('success');
      })
      .error(function (error) {
        $log.error(error.message);
        deferred.reject(error.message);
      });
    return deferred.promise;
  };

  authService.sendPasswordReset = function(user) {
    var deferred = $q.defer();
    $http.post('/user/reset', user)
      .success(function () {
        deferred.resolve('success');
      })
      .error(function (error) {
        $log.error(error.message);
        if (error.verify) {
          deferred.reject(error.message + ' If you have not received an email, you can <a href="/#/verify">resend</a> the verification email.');
        } else {
          deferred.reject(error.message);
        }
      });
    return deferred.promise;
  };

  authService.verifyResetToken = function(token) {
    var deferred = $q.defer();
    $http.get('/user/resetverify/' + token)
      .success(function (token) {
        deferred.resolve(token);
      })
      .error(function (error) {
        $log.error(error.message);
        deferred.reject(error.message);
      });
    return deferred.promise;
  };

  authService.resetPassword = function(user) {
    var deferred = $q.defer();
    $http.post('/user/reset/' + user.token, user)
      .success(function () {
        deferred.resolve('success');
      })
      .error(function (error) {
        $log.error(error.message);
        deferred.reject(error.message);
      });
    return deferred.promise;
  };

  authService.verifyCaptcha = function(captcha) {
    var deferred = $q.defer();

    $http.post('/user/captcha', {'response' : captcha})
      .success(function () {
        deferred.resolve('success');
      })
      .error(function (error) {
        $log.error(error);
        deferred.reject(error.message);
      });
    return deferred.promise;
  };

  authService.publicLogin = function (moduleId, extid) {
    var deferred = $q.defer();
   
    $http.get('/public/login/' + moduleId + '?extid=' + extid)
      .success(function (data) {
        userService.createSession(data.code.toString(), data.token, data.roles, data.code);
        deferred.resolve(data.module);
      })
      .error(function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };
  
  return authService;

}

export default AuthService;