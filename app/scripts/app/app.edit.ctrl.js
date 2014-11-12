'use strict';

angular.module('tatool.app')
  .controller('EditCtrl', ['$scope', '$q', '$modalInstance', '$sce', 'module', 'moduleDataService',
    function ($scope, $q, $modalInstance, $sce, module, moduleDataService) {

      var EXECUTABLE_STATIC_PROPERTIES = ['tatoolType', 'customType', 'name', 'blankInterval', 'fixationInterval', 'status'];

      $scope.module = module;
      $scope.element = {};
      $scope.elementIndex = {};
      $scope.elementParent = {};

      $scope.highlightId = {key: 0};

      $scope.alert = {};
      $scope.elementType = '../../views/app/edit_module.html';

      $scope.openModule = function() {
        hideAlert();
        $scope.highlightId.key = 'module';
        $scope.elementType = '../../views/app/edit_module.html';
      };

      $scope.openElement = function(element, index, parent) {
        hideAlert();
        $scope.element = element;
        $scope.elementIndex = index;
        $scope.elementParent = parent;
        $scope.customProperties = [];

        if (element.tatoolType === 'List' || element.tatoolType === 'Dual') {
          $scope.elementType = '../../views/app/edit_list.html';
        } else if (element.tatoolType === 'Executable') {
          // prepare custom properties
          angular.forEach(element, function(value, key) {
            if (key.substring(0,1) !== '$') {
              if (EXECUTABLE_STATIC_PROPERTIES.indexOf(key) === -1) {
                var obj = {};
                obj.propertyName = key;
                obj.propertyType = Object.prototype.toString.call( value );
                obj.disabled = (obj.propertyType === '[object Object]') ? true : false;
                $scope.customProperties.push(obj);
              }
            }
          });

          console.log($scope.customProperties);

          $scope.elementType = '../../views/app/edit_executable.html';
        }
      };

      $scope.saveModule = function() {
        moduleDataService.addModule(module).then(function(data) {
          setAlert('success', 'Module successfully saved.');
        }, function(error) {
          setAlert('danger', error);
        });
      };

      $scope.addNewExecutable = function(element, elementIndex, elementParent) {
        var executable = {
          "tatoolType": "Executable",
          "customType": "",
          "name": (Math.random().toString(36)+'00000000000000000').slice(2,16+2)
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            console.log('full already');
          } else if (!element.children.primary) {
            element.children.primary = executable;
          } else {
            element.children.secondary = executable;
          }
        } else {
          element.children.splice(element.children.length, 0, executable);
        }
      };

      $scope.addNewList = function(element, elementIndex, elementParent) {
        var list = {
          "tatoolType": "List",
          "iterator": { "customType" : "ListIterator", "numIterations" : "1" },
          "handlers": [  ],
          "children": [  ]
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            console.log('full already');
          } else if (!element.children.primary) {
            element.children.primary = list;
          } else {
            element.children.secondary = list;
          }
        } else {
          element.children.splice(element.children.length, 0, list);
        }
      };

      $scope.addNewDual = function(element, elementIndex, elementParent) {
        var list = {
          "tatoolType": "Dual",
          "iterator": { "customType" : "ListIterator", "numIterations" : "1" },
          "handlers": [  ],
          "children": { }
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            console.log('full already');
          } else if (!element.children.primary) {
            element.children.primary = list;
          } else {
            element.children.secondary = list;
          }
        } else {
          element.children.splice(element.children.length, 0, list);
        }
      };

      $scope.moveElementUp = function(element, index, parent) {
        if (parent) {
          if (parent.tatoolType === 'Dual') {
            if (index === 'secondary') {
              var tmp = parent.children.primary;
              parent.children.primary = parent.children.secondary;
              parent.children.secondary = tmp;
              $scope.elementIndex = 'primary';
            }
          } else {
            var moveTo = parseInt(index) - 1;
            if (index > 0 && parent.children[moveTo]) {
              var tmp = parent.children[index];
              parent.children[index] = parent.children[moveTo];
              parent.children[moveTo] = tmp;
              $scope.elementIndex = moveTo;
            } 
          }
        }
      };

      $scope.moveElementDown = function(element, index, parent) {
        if (parent) {
          if (parent.tatoolType === 'Dual') {
            if (index === 'primary') {
              var tmp = parent.children.secondary;
              parent.children.secondary = parent.children.primary;
              parent.children.primary = tmp;
              $scope.elementIndex = 'secondary';
            }
          } else {
            var moveTo = parseInt(index) + 1;
            if (index < (parent.children.length - 1) && parent.children[moveTo]) {
              var tmp = parent.children[index];
              parent.children[index] = parent.children[moveTo];
              parent.children[moveTo] = tmp;
              $scope.elementIndex = moveTo;
            }
          }
        }
      };

      $scope.deleteElement = function(element, index, parent) {
        if (parent) {
          if (parent.tatoolType === 'Dual') {
            delete parent.children[index];
            $scope.elementType = '../../views/app/edit_module.html';
          } else {
            parent.children.splice(index, 1);
            $scope.elementType = '../../views/app/edit_module.html';
          }
        }
      };

      $scope.ok = function () {
        $modalInstance.close();
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      var setAlert = function(alertType, alertMessage) {
        $scope.alert = {};
        $scope.alert.type = alertType;
        $scope.alert.msg = $sce.trustAsHtml(alertMessage);
        $scope.alert.visible = true;
      }

      var hideAlert = function() {
        $scope.alert = {};
        $scope.alert.visible = false;
        $scope.alert.msg = '';
      };

      $scope.hideAlert = hideAlert;

  }]);
