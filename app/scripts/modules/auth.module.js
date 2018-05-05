'use strict';

import angular from 'angular';
import angularrecaptcha from 'angular-recaptcha';

import tatool from './app.js';
import tatoolCommon from './common.module.js';

import UserService from '../auth/user.service.js';
import AuthService from '../auth/auth.service.js';
import AuthInterceptor from '../auth/auth.interceptor.js';
import LoginCtrl from '../auth/auth.login.ctrl.js';



var tatoolAuth = angular.module('tatool.auth', [tatool, tatoolCommon, angularrecaptcha])
  .constant('cfgAuth', {
    IMG_PATH: 'images/auth/',
    VIEW_PATH:'views/auth/'
  });

tatoolAuth.factory('userService', UserService);
tatoolAuth.factory('authService', AuthService);
tatoolAuth.factory('authInterceptor', AuthInterceptor);
tatoolAuth.controller('LoginCtrl', LoginCtrl);

tatoolAuth.config(['$httpProvider', '$stateProvider', function ($httpProvider, $stateProvider) {

    // auth interceptor
    $httpProvider.interceptors.push('authInterceptor');

    // application states
    $stateProvider
      .state('login', {
        url: '/login?verify',
        template: require('../../views/auth/login.html'),
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
        template: require('../../views/auth/verificationResend.html'),
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
        template: require('../../views/auth/passwordReset.html'),
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
        template: require('../../views/auth/register.html'),
        controller: 'LoginCtrl',
        resolve: {
          token: [ function() {
            return null;
          }]
        }
      });
  }]);

  export default tatoolAuth.name;