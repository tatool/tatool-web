'use strict';

/* global Prism */

angular.module('tatool.app')
  .controller('StartCtrl', ['$scope', '$http', '$location', '$anchorScroll', '$state',
    function ($scope, $http, $location, $anchorScroll, $state) {

      $scope.stopDevSignup = false;
      $scope.docPage = 'views/doc/main-about.html';
      $scope.slides = ['slide-develop.html', 'slide-publish.html', 'slide-collect.html', 'slide-analyse.html'];
      var currentSlide = 0;
      $scope.slide = 'views/' + $scope.slides[currentSlide];

      $scope.go = function(state) {
        $state.go(state);
      };

      $scope.nextSlide = function() {
        if (currentSlide < $scope.slides.length - 1) {
          currentSlide++;
          $scope.slide = 'views/' + $scope.slides[currentSlide];
        }
      };

      $scope.prevSlide = function() {
        if (currentSlide > 0) {
          currentSlide--;
          $scope.slide = 'views/' + $scope.slides[currentSlide];
        }
      };

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

      $scope.goPage = function(page) {
        $scope.docPage = 'views/doc/' + page;
        $scope.scrollTo('top');
      };

      $scope.scrollTo = function(id) {
        var old = $location.hash();
        $location.hash(id);
        $anchorScroll();
        //reset to old to keep any additional routing logic from kicking in
        $location.hash(old);
      };

      $scope.highlightCode = function() {
        Prism.highlightAll();
      };

    }]);
