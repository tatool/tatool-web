'use strict';

angular.module('tatool.app')
  .controller('StartCtrl', ['$scope', '$http', '$location', '$anchorScroll',
    function ($scope, $http, $location, $anchorScroll) {

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

      $scope.docPage = 'views/doc/test.html';

      $scope.goPage = function(page) {
        $scope.docPage = 'views/doc/' + page;
      };

      $scope.scrollTo = function(id) {
        var old = $location.hash();
        $location.hash(id);
        $anchorScroll();
        //reset to old to keep any additional routing logic from kicking in
        $location.hash(old);
      }

      $scope.highlightCode = function() {
        console.log('highlight');
        Prism.highlightAll();
      };

    }]);
