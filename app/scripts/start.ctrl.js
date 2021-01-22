'use strict';

/* global Prism */

import Prism from 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

import 'prismjs/themes/prism.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

StartCtrl.$inject = ['$scope', '$http', '$location', '$anchorScroll', '$state', '$timeout', 'page'];

function StartCtrl($scope, $http, $location, $anchorScroll, $state, $timeout, page) {

      $scope.stopDevSignup = false;
      $scope.slides = ['slide-develop.html', 'slide-publish.html', 'slide-collect.html', 'slide-analyse.html'];
      var currentSlide = 0;
      $scope.slide = $scope.slides[currentSlide];

      $scope.go = function(state) {
        $state.go(state);
      };

      $scope.nextSlide = function() {
        if (currentSlide < $scope.slides.length - 1) {
          currentSlide++;
          $scope.slide = $scope.slides[currentSlide];
        }
      };

      $scope.prevSlide = function() {
        if (currentSlide > 0) {
          currentSlide--;
          $scope.slide = $scope.slides[currentSlide];
        }
      };

      $scope.goPage = function(page) {
        $scope.docPage = page;
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

      if (page === 'start') {
        $scope.parentPage = 'start';
        $state.go('doc', {page: 'main-start.html'});
      } else if (page !== '') {
        var strArr = page.split('-');
        if (strArr[0] === 'main') {
          $scope.parentPage = strArr[1].split('.')[0];
        } else {
          $scope.parentPage = strArr[0];
        }
        $scope.docPage = page;
        $timeout(function() {$scope.scrollTo('top'); }, 0);
      }

}

export default StartCtrl;
