'use strict';

angular.module('tatool', ['ngRoute','ui.bootstrap', 'ui.router', 'tatool.app'])
  .constant('cfg', {
    VIEW_PATH:'views/app/'
  })
  .config(['$stateProvider', '$urlRouterProvider', '$provide', function ($stateProvider, $urlRouterProvider, $provide) {

    // making sure we always point to root in case of unknown url
    $urlRouterProvider.otherwise('/');

    // helper function for ui-router to force a reload of a state
    $provide.decorator('$state', ['$delegate', '$stateParams', function($delegate, $stateParams) {
      $delegate.forceReload = function() {
        return $delegate.go($delegate.current, $stateParams, {
          location: false,
          reload: true,
          inherit: false,
          notify: true
        });
      };
      return $delegate;
    }]);

  }]);


angular.module('tatool').directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = element.scope()[attrs.customOnChange];
      element.bind('change', onChangeFunc);
    }
  };
});