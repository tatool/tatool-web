'use strict';

angular.module('tatool.app')
  .controller('StartCtrl', ['$scope', '$http', '$state',
    function ($scope, $http) {

      $scope.stopDevSignup = false;

      $scope.applyDeveloper = function(emailDev) {
        if (emailDev) {
          var email = {email: emailDev};

          $http.post('/user/devaccount/', email)
            .success(function (data) {
              if (data === 'null') {
                data = null;
              }
              $scope.emailDev = '';
              $scope.singupComplete = 'Thanks, we\'ll let you know once your developer account is activated.';
              $scope.stopDevSignup = true;
            })
            .error(function (error) {
              $scope.emailDev = '';
              $scope.singupComplete = error.message;
              $scope.stopDevSignup = true;
            });
        }
      };

    }]);
