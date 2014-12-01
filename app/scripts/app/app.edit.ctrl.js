'use strict';

angular.module('tatool.app')
  .controller('EditCtrl', ['$scope', '$q', '$modalInstance', '$sce', '$compile', 'module',
    function ($scope, $q, $modalInstance, $sce, $compile, module) {

      var EXECUTABLE_STATIC_PROPERTIES = ['tatoolType', 'customType', 'name', 'blankInterval', 'fixationInterval', 'status'];

      $scope.customTypes = ['tatoolInstruction', 'tatoolCountdown', 'tatoolStroop', 'tatoolComplexSpan'];

      $scope.module = module;
      $scope.element = {};
      $scope.elementIndex = {};
      $scope.elementParent = {};

      $scope.highlightId = {key: 'module'};

      $scope.alert = {};
      $scope.elementType = '../../views/app/edit_module.html';

      $scope.trustAsHtml = function(value) {
        return $sce.trustAsHtml(value);
      };

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
          loadCustomProperties(element);
          $scope.elementType = '../../views/app/edit_executable.html';
        }
      };

      // populate scope variable with custom properties
      function loadCustomProperties(element) {
        $scope.customProperties = [];
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
      }

      $scope.addNewExecutable = function(element) {
        hideAlert();
        var executable = {
          'tatoolType': 'Executable',
          'customType': '',
          'name': (Math.random().toString(36)+'00000000000000000').slice(2,16+2)
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            setAlert('danger', 'This Dual element already has a primary and a secondary element.');
          } else if (!element.children.primary) {
            element.children.primary = executable;
          } else {
            element.children.secondary = executable;
          }
        } else {
          element.children.splice(element.children.length, 0, executable);
        }
      };

      $scope.addNewList = function(element) {
        hideAlert();
        var list = {
          'tatoolType': 'List',
          'iterator': { 'customType' : 'ListIterator', 'numIterations' : '1' },
          'handlers': [  ],
          'children': [  ]
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            setAlert('danger', 'This Dual element already has a primary and a secondary element.');
          } else if (!element.children.primary) {
            element.children.primary = list;
          } else {
            element.children.secondary = list;
          }
        } else {
          element.children.splice(element.children.length, 0, list);
        }
      };

      $scope.addNewDual = function(element) {
        hideAlert();
        var list = {
          'tatoolType': 'Dual',
          'iterator': { 'customType' : 'ListIterator', 'numIterations' : '1' },
          'handlers': [  ],
          'children': { }
        };
        if (element.tatoolType === 'Dual') {
          if (element.children.primary && element.children.secondary) {
            setAlert('danger', 'This Dual element already has a primary and a secondary element.');
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
        hideAlert();
        if (parent) {
          if (parent.tatoolType === 'Dual') {
            if (index === 'secondary') {
              var tmpPrimary = parent.children.primary;
              parent.children.primary = parent.children.secondary;
              parent.children.secondary = tmpPrimary;
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

        $scope.highlightId.key = '';
      };

      $scope.moveElementDown = function(element, index, parent) {
        hideAlert();
        if (parent) {
          if (parent.tatoolType === 'Dual') {
            if (index === 'primary') {
              var tmpSecondary = parent.children.secondary;
              parent.children.secondary = parent.children.primary;
              parent.children.primary = tmpSecondary;
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

        $scope.highlightId.key = '';
      };

      $scope.deleteElement = function(element, index, parent) {
        hideAlert();
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

      $scope.deleteProperty = function(element, property) {
        hideAlert();
        delete element[property.propertyName];
        loadCustomProperties(element);
      };

      $scope.addProperty = function(element) {
        hideAlert();
        var box =bootbox.dialog({
          title: '<b>Add new Property</b>',
          message: '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                    '<form class="form-horizontal"> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Property Name</label> ' +
                    '<div class="col-md-4"> ' +
                    '<input id="newPropertyName" name="newPropertyName" type="text" class="form-control input-md"> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="type">Property Type</label> ' +
                    '<div class="col-md-4"> <div class="radio"> <label for="type-0"> ' +
                    '<input type="radio" name="type" id="type-0" value="String" checked="checked"> ' +
                    'String </label> ' +
                    '</div><div class="radio"> <label for="type-1"> ' +
                    '<input type="radio" name="type" id="type-1" value="Array"> Array</label> ' +
                    '</div> ' +
                    '</div> </div>' +
                    '</form> </div>  </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function () {
                var propertyName = $('#newPropertyName').val();
                var propertyType = $('input[name=\'type\']:checked').val();
                if (!propertyName || propertyName === '' || propertyName.indexOf(' ') >= 0 || !isNaN(parseInt(propertyName))) {
                  setAlert('danger', 'Invalid property name or missing.');
                  $scope.$apply();
                } else {
                  insertProperty(element, propertyName, propertyType);
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

        box.bind('shown.bs.modal', function(){
          $('#newPropertyName').focus();
        });

        $('#newPropertyName').keypress(function(e) {
          if(e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      function insertProperty(element, propertyName, propertyType) {
        if (propertyType === 'Array') {
          element[propertyName] = [];
        } else {
          element[propertyName] = '';
        }

        loadCustomProperties(element);
        $scope.$apply();
      }

      $scope.addEntry = function(element, property) {
        hideAlert();
        element[property.propertyName].push('');
        loadCustomProperties(element);
      };

      $scope.deleteEntry = function(element, property, index) {
        hideAlert();
        element[property.propertyName].splice(index, 1);
        loadCustomProperties(element);
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
      };

      var hideAlert = function() {
        $scope.alert = {};
        $scope.alert.visible = false;
        $scope.alert.msg = '';
      };

      $scope.hideAlert = hideAlert;

    }]);
