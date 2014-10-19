'use strict';

angular.module('tatool.app').directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = element.scope()[attrs.customOnChange];
      element.bind('change', onChangeFunc);
      element.bind('change', function() { document.getElementById('addModuleForm').reset(); });
    }
  };
});