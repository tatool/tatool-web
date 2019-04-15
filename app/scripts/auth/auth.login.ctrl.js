'use strict';

/* global $script */

import $script from 'scriptjs';

LoginCtrl.$inject = ['$scope', '$log', '$state', '$sce', '$anchorScroll', '$location', 'authService', 'messageService', 'spinnerService', 'cfg', 'token'];

function LoginCtrl($scope, $log, $state, $sce, $anchorScroll, $location, authService, messageService, spinnerService, cfg, token) {

    $scope.alert = { type: 'danger', msg: '', visible: false };

    $scope.token = token;

    $scope.go = function(state) {
      $state.go(state);
    };

    // login with authService and redirect if successful
    $scope.login = function(credentials) {
      if (!credentials) {
        setAlert('danger', 'Please enter all required fields:<br><ul><li> Email<li> Password</ul>');
      } else if (!credentials.userName || !credentials.userPassword) {
        var alertText = 'Please enter all required fields:<br><ul>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword) ? '<li> Password' : '';
        alertText += '</ul>';
        setAlert('danger', alertText);
        $scope.credentials.userName = '';
        $scope.credentials.userPassword = '';
      } else {
        authService.login(credentials).then(function() {
          $state.go('home');
        }, function(error) {
          setAlert('danger', error);
          messageService.getMessage(); // consume message
          $scope.credentials.userName = '';
          $scope.credentials.userPassword = '';
        });
      }
    };

    // register new user with authService
    $scope.register = function(credentials) {

      var alertText = '';
      if (!credentials) {
        setAlert('danger', 'Please enter all required fields:<br><ul> <li> Email<li> Password</ul>');
      } else if (!credentials.userName || !credentials.userPassword || !credentials.userPassword2) {
        alertText = 'Please enter all required fields:<br><ul>';
        alertText += (!credentials.userName) ? '<li> Email' : '';
        alertText += (!credentials.userPassword || !credentials.userPassword2) ? '<li> Password' : '';
        alertText += '</ul>';
        setAlert('danger', alertText);
      } else if (credentials.userPassword !== credentials.userPassword2) {
        alertText = 'The passwords you entered don\'t match.';
        setAlert('danger', alertText);
      } else if (!credentials.captcha && cfg.MODE === 'REMOTE') {
        alertText = 'You have not solved the Captcha.';
        setAlert('danger', alertText);
      } else {
        hideAlert();

        spinnerService.spin('loadingSpinner');

        authService.verifyCaptcha(credentials.captcha).then(function() {
          authService.register(credentials).then(function() {
            spinnerService.stop('loadingSpinner');
            $state.go('login');
          }, function(error) {
            spinnerService.stop('loadingSpinner');
            setAlert('danger', error);
          });
        }, function(error) {
          spinnerService.stop('loadingSpinner');
          setAlert('danger', error);
        });
      }
    };

    $scope.verifyUser = function(user) {
      hideAlert();
      if (!user || !user.email) {
        setAlert('danger', 'Please enter a valid email address.');
      } else {
        authService.resendVerification(user).then(function() {
          setAlert('success', 'Verification email sent. Click the link in the email to activate your account.');
        }, function(error) {
          setAlert('danger', error);
        });
      }
    };

    $scope.sendPasswordReset = function(user) {
      hideAlert();
      if (!user || !user.email) {
        setAlert('danger', 'Please enter a valid email address.');
      } else {
        authService.sendPasswordReset(user).then(function() {
          setAlert('success', 'Password reset email sent. Click the link in the email to change your password.');
        }, function(error) {
          setAlert('danger', error);
        });
      }
    };

    $scope.resetPassword = function(user) {
      hideAlert();
      if (!user || !token || !user.userPassword || !user.userPassword2 || user.userPassword !== user.userPassword2) {
        setAlert('danger', 'Please enter a valid password.');
      } else {
        user.token = token.token;
        authService.resetPassword(user).then(function() {
          messageService.setMessage({ type: 'success', msg: 'Password successfully changed. You can go ahead and login now.'});
          $state.go('login');
        }, function(error) {
          setAlert('danger', error);
        });
      }
    };

    function scrollTo(id) {
      var old = $location.hash();
      $location.hash(id);
      $anchorScroll();
      //reset to old to keep any additional routing logic from kicking in
      $location.hash(old);
    }

    function setAlert(alertType, alertMessage) {
      $scope.alert.type = alertType;
      $scope.alert.msg = $sce.trustAsHtml(alertMessage);
      $scope.alert.visible = true;
      scrollTo('messagebox');
    }

    function hideAlert() {
      $scope.alert.visible = false;
      $scope.alert.msg = '';
    }

    /*
    function showRecaptcha(element) {
      Recaptcha.create('6LfSvfwSAAAAAOD0SuK_6f3vswGHswyH3kiHj-q3', element, {
        theme: 'clean'
      });
    }

    // captcha loading
    if ($state.current.name === 'register' && cfg.MODE === 'REMOTE') {
      $script('http://www.google.com/recaptcha/api/js/recaptcha_ajax.js', function() {
        showRecaptcha('captcha');
      });
    }
    */

    // on load message handler
    var message = messageService.getMessage();
    if (message.msg !== '') {
      setAlert(message.type, message.msg);
    } else {
      hideAlert();
    }

}

export default LoginCtrl;