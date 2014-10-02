tatool-web
==========

```javascript
angular.module('tatool').directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = element.scope()[attrs.customOnChange];
      element.bind('change', onChangeFunc);
    }
  };
});
```
