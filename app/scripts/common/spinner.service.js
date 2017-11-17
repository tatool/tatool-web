'use strict';

import { Spinner } from 'spin.js';

SpinnerService.$inject = ['$log', '$rootScope'];
TatoolSpinner.$inject = ['$window'];

/**
 * Tatool Spinner adaptation from original angular-spinner 
 *
 * by http://github.com/urish/angular-spinner
 * angular-spinner version 0.5.1
 * License: MIT.
 * Copyright (C) 2013, 2014, Uri Shaked and contributors.
 */

 /* global Spinner */

function SpinnerService($log, $rootScope) {
    var config = {};

    config.spin = function (key, text) {
      if (!text) {
        text = 'Please wait...';
      }
      $rootScope.$broadcast('tatool-spinner:spin', key, text);
    };

    config.stop = function (key) {
      $rootScope.$broadcast('tatool-spinner:stop', key);
    };

    return config;
}

function TatoolSpinner($window) {
    return {
      scope: true,
      link: function (scope, element, attr) {

        var SpinnerConstructor = Spinner || $window.Spinner;

        scope.spinner = null;

        scope.key = angular.isDefined(attr.spinnerKey) ? attr.spinnerKey : false;

        scope.startActive = angular.isDefined(attr.spinnerStartActive) ?
          attr.spinnerStartActive : scope.key ?
            false : true;

        function stopSpinner() {
          if (scope.spinner) {
            scope.spinner.stop();
          }
        }

        scope.spin = function () {
          if (scope.spinner) {
            scope.spinner.spin(spinnerAnimationEl[0]);
          }
        };
        
        scope.stop = function () {
          scope.startActive = false;
          stopSpinner();
        };

        scope.$watch(attr.tatoolSpinner, function (options) {
          stopSpinner();
          scope.spinner = new SpinnerConstructor(options);
          if (!scope.key || scope.startActive) {
            scope.spinner.spin(element[0]);
          }
        }, true);

        scope.$on('tatool-spinner:spin', function (event, key, text) {
          if (key === scope.key) {
            scope.spinnerText = text;
            setVisibility('visible');
            scope.spin();
          }
        });

        scope.$on('tatool-spinner:stop', function (event, key) {
          if (key === scope.key) {
            scope.spinnerText = '';
            setVisibility('hidden');
            scope.stop();
          }
        });

        var spinnerTextEl = element.find('#spinnerText');
        var spinnerAnimationEl = element.find('#spinnerAnimation');

        function setVisibility(text) {
          element.children().css('visibility', text);
          spinnerTextEl.css('visibility', text);
          spinnerAnimationEl.css('visibility', text);
        }

        scope.$on('$destroy', function () {
          scope.stop();
          scope.spinner = null;
        });
      },
      //templateUrl: '../../views/app/spinner.html'
      template: require('../../views/app/spinner.html')
    };
}

export {
  SpinnerService,
  TatoolSpinner,
}