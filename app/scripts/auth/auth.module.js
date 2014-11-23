'use strict';

angular.module('tatool.auth', ['tatool', 'base64', 'tatool.common'])
  .constant('cfgAuth', {
    IMG_PATH: 'images/auth/',
    VIEW_PATH:'views/auth/'
  })
  .config(['$httpProvider', '$stateProvider', function ($httpProvider, $stateProvider) {

    // auth interceptor
    $httpProvider.interceptors.push('authInterceptor');

    // application states
    $stateProvider
      .state('login', {
        url: '/login?verify',
        templateUrl: 'views/auth/login.html',
        controller: 'LoginCtrl',
        resolve: {
          token: [ function() {
            return null;
          }],
          verify: ['$stateParams', 'messageService', function($stateParams, messageService) {
            if ($stateParams.verify === 'success') {
              messageService.setMessage({ type: 'success', msg: 'Email verification successful. You can go ahead and login now.'});
            } else if ($stateParams.verify === 'failure') {
              messageService.setMessage({ type: 'danger', msg: 'Email verification failed. You can <a href="/#/verify">resend</a> the verification email.'});
            }
          }]
        }
      })
      .state('verify', {
        url: '/verify',
        templateUrl: 'views/auth/verificationResend.html',
        controller: 'LoginCtrl',
        resolve: {
          token: ['messageService', function(messageService) {
            messageService.setMessage({ type: 'info', msg: 'Please enter the email you registered with to resend the verification email.'});
            return null;
          }]
        }
      })
      .state('reset', {
        url: '/reset?token',
        templateUrl: 'views/auth/passwordReset.html',
        controller: 'LoginCtrl',
        resolve: {
          token: ['$stateParams', '$state', '$q', 'messageService', 'authService', function($stateParams, $state, $q, messageService, authService) {
            if (!$stateParams.token || $stateParams.token === true) {
              messageService.setMessage({ type: 'info', msg: 'Please enter the email you registered with to send a password reset email.'});
              return null;
            } else if ($stateParams.token.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
              var deferred = $q.defer();
              authService.verifyResetToken($stateParams.token).then(function(token) {
                messageService.setMessage({ type: 'info', msg: 'Please enter your new password.'});
                deferred.resolve(token);
              }, function(error) {
                deferred.reject(error);
              });
              return deferred.promise;
            } else {
              return $q.reject('error');
            }
          }]
        }
      })
      .state('register', {
        url: '/register',
        templateUrl: 'views/auth/register.html',
        controller: 'LoginCtrl',
        resolve: {
          token: [ function() {
            return null;
          }]
        }
      });
  }]);