'use strict';

Tree.$inject = ['recursionHelper'];
ChecklistModel.$inject = ['$parse', '$compile'];

function CustomOnChange() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = element.scope()[attrs.customOnChange];
      element.bind('change', onChangeFunc);
      element.bind('change', function() { document.getElementById('openModuleForm').reset(); });
    }
  };
}

function Tree(recursionHelper) {
  return {
    restrict: 'E',
    scope: {
      element: '=',
      onelementclick: '&',
      topFunc: '=',
      index: '@',
      parent: '=',
      highlight: '='
    },
    template:
        '<div ng-switch on="element.tatoolType">' +
          '<div ng-switch-when="Executable">' +
            '<li ng-click="topFunc(element, index, parent);highlightElement()" ng-class="{\'active\' : highlight.key === element.name}">' +
              '<i class="fa fa-play-circle"></i> {{ (element.customType) ? element.customType : element.tatoolType }}' +
            '</li>' +
          '</div>' +
          '<div ng-switch-when="List">' +
            '<li ng-click="topFunc(element, index, parent);highlightElement()" ng-class="{\'active\' : highlight.key === element.name}">' +
              '<i class="fa fa-list"></i> {{ (element.label) ? element.label : element.tatoolType }}' +
            '</li>' +
            '<ul>' +
              '<tree element="child" ng-repeat="child in element.children track by $index" index="{{$index}}" parent="element" onElementClick="topFunc(element, index, parent)" top-func="topFunc" highlight="highlight"></tree>' +
            '</ul>' +
          '</div>' +
          '<div ng-switch-when="Dual">' +
            '<li ng-click="topFunc(element, index, parent);highlightElement()" ng-class="{\'active\' : highlight.key === element.name}">' +
              '<i class="fa fa-list-ol"></i> {{ (element.label) ? element.label : element.tatoolType }}' +
            '</li>' +
              '<ul>' +
                '<tree element="element.children.primary" index="primary" parent="element" onElementClick="topFunc(element, index, parent)" top-func="topFunc" highlight="highlight"></tree>' +
              '</ul>' +
              '<ul>' +
                '<tree element="element.children.secondary" index="secondary" parent="element" onElementClick="topFunc(element, index, parent)" top-func="topFunc" highlight="highlight"></tree>' +
              '</ul>' +
          '</div>' +
          '<div ng-switch-default>' +
            '{{ element.tatoolType }}' +
          '</div>' +
        '</div>',
    compile: function(element) {
      return recursionHelper.compile(element, function(scope) {

        scope.highlightElement = function() {
          scope.highlight.key = scope.element.name;
        };
      });
    }
  };
}


/**
 * Checklist-model
 * AngularJS directive for list of checkboxes
 */

function ChecklistModel($parse, $compile) {
  // contains
  function contains(arr, item) {
    if (angular.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (angular.equals(arr[i], item)) {
          return true;
        }
      }
    }
    return false;
  }

  // add
  function add(arr, item) {
    arr = angular.isArray(arr) ? arr : [];
    for (var i = 0; i < arr.length; i++) {
      if (angular.equals(arr[i], item)) {
        return arr;
      }
    }
    arr.push(item);
    return arr;
  }

  // remove
  function remove(arr, item) {
    if (angular.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (angular.equals(arr[i], item)) {
          arr.splice(i, 1);
          break;
        }
      }
    }
    return arr;
  }

  // http://stackoverflow.com/a/19228302/1458162
  function postLinkFn(scope, elem, attrs) {
    // compile with `ng-model` pointing to `checked`
    $compile(elem)(scope);

    // getter / setter for original model
    var getter = $parse(attrs.checklistModel);
    var setter = getter.assign;

    // value added to list
    var value = $parse(attrs.checklistValue)(scope.$parent);

    // watch UI checked change
    scope.$watch('checked', function(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }
      var current = getter(scope.$parent);
      if (newValue === true) {
        setter(scope.$parent, add(current, value));
      } else {
        setter(scope.$parent, remove(current, value));
      }
    });

    // watch original model change
    scope.$parent.$watch(attrs.checklistModel, function(newArr) {
      scope.checked = contains(newArr, value);
    }, true);
  }

  return {
    restrict: 'A',
    priority: 1000,
    terminal: true,
    scope: true,
    compile: function(tElement, tAttrs) {
      if (tElement[0].tagName !== 'INPUT' || !tElement.attr('type', 'checkbox')) {
        throw 'checklist-model should be applied to `input[type="checkbox"]`.';
      }

      if (!tAttrs.checklistValue) {
        throw 'You should provide `checklist-value`.';
      }

      // exclude recursion
      tElement.removeAttr('checklist-model');
      
      // local scope var storing individual checkbox model
      tElement.attr('ng-model', 'checked');

      return postLinkFn;
    }
  };
}

export {
  CustomOnChange,
  Tree,
  ChecklistModel
}