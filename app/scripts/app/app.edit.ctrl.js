'use strict';

angular.module('tatool.app')
  .controller('EditCtrl', ['$scope', '$q', '$modalInstance', '$sce', '$compile', '$modal', 'module', 'moduleDataService',
    function ($scope, $q, $modalInstance, $sce, $compile, $modal, module, moduleDataService) {

      var VIEW_PATH = '../../views/app/';

      var EXECUTABLE_STATIC_PROPERTIES = ['tatoolType', 'customType', 'name', 'blankInterval', 'fixationInterval', 'status', 'project'];

      $scope.resourceTypes = ['stimuli', 'instructions'];

      $scope.module = module;
      $scope.element = {};
      $scope.elementIndex = {};
      $scope.elementParent = {};

      $scope.highlightId = {key: 'module'};

      $scope.alert = {};
      $scope.elementType = '../../views/app/edit_module.html';
      $scope.projects = [];
      $scope.executables = [];

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
          $scope.elementType = VIEW_PATH + 'edit_list.html';
        } else if (element.tatoolType === 'Executable') {
          // prepare custom properties
          loadCustomProperties(element);
          $scope.elementType = VIEW_PATH + 'edit_executable.html';
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
              obj.propertyType = value.propertyType; //Object.prototype.toString.call( value );
              //obj.disabled = (obj.propertyType === '[object Object]') ? true : false;
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
            $scope.elementType = VIEW_PATH + 'edit_module.html';
          } else {
            parent.children.splice(index, 1);
            $scope.elementType = VIEW_PATH + 'edit_module.html';
          }
        }
      };

      function getProjects() {
        moduleDataService.getProjects().then(function(data) {
          $scope.projects = data;
          $scope.projects.push({ access: 'external', name: 'External Resource', description: 'Allows you to provide a complete URL.' });
        }, function(err) {
          $log.error(err);
        });
      };

      // loading all projects from tatool
      getProjects();

      $scope.selectExecutable = function() {
        $scope.currentProject = {};
        $scope.currentExecutable = {};

        if ($scope.element.project) {
          for (var i=0; i < $scope.projects.length; i++) {
            if ($scope.projects[i].name === $scope.element.project.name && $scope.projects[i].access === $scope.element.project.access) {
              $scope.currentProject = $scope.projects[i];
              break;
            }
          }

          if ($scope.currentProject.executables) {
            for (var i=0; i < $scope.currentProject.executables.length; i++) {
              if ($scope.currentProject.executables[i].customType === $scope.element.customType) {
                $scope.currentExecutable = $scope.currentProject.executables[i];
                break;
              }
            }
          }
          
        }

        $scope.elementType = VIEW_PATH + 'edit_executable_select.html';
      };

      $scope.groupByProjectAccess = function (item) {
        if (item.access === 'public') {
          return 'Public';
        } else if (item.access === 'private') {
          return 'Private';
        } else if (item.access === 'external') {
          return 'External';
        } else {
          return undefined;
        }
      };

      // triggered by Select Executable
      $scope.chooseProject = function($item, $model) {
        var project = {};
        project.name = $item.name;
        project.access = $item.access;
        $scope.element.project = project;
        $scope.element.customType = '';
        $scope.currentProject = $item;
        $scope.currentExecutable = {};
      };

      // triggered by Select Executable
      $scope.chooseExecutable = function($item, $model) {
        var customType = $item.customType;
        $scope.element.customType = customType;
        $scope.currentExecutable = $item;
      };

      $scope.returnTo = function(string) {
        if (string === 'executable') {
          $scope.elementType = VIEW_PATH + 'edit_executable.html';
        }
      };




      $scope.editProperty = function(property, $index) {
        $scope.currentProject = {};
        $scope.customProperty = {};
        if ($index >= 0) {
          $scope.customProperty = $scope.element[property.propertyName].propertyValue[$index];
        } else {
          $scope.customProperty = $scope.element[property.propertyName];
        }

        if ($scope.customProperty.project) {
          for (var i=0; i < $scope.projects.length; i++) {
            if ($scope.projects[i].name === $scope.customProperty.project.name && $scope.projects[i].access === $scope.customProperty.project.access) {
              $scope.currentProject = $scope.projects[i];
              break;
            }
          }
        } else {
          $scope.currentProject = {};
        }

        $scope.elementType = VIEW_PATH + 'edit_executable_property.html';
        $scope.currentProperty = property;
      };

      $scope.editPathProperty = function(property, $index) {
        $scope.customProperty = {};
        if ($index >= 0) {
          $scope.customProperty = $scope.element[property.propertyName].propertyValue[$index];
        } else {
          $scope.customProperty = $scope.element[property.propertyName];
        }

        if ($scope.customProperty.project) {
          for (var i=0; i < $scope.projects.length; i++) {
            if ($scope.projects[i].name === $scope.customProperty.project.name && $scope.projects[i].access === $scope.customProperty.project.access) {
              $scope.currentProject = $scope.projects[i];
              break;
            }
          }
        } else {
          $scope.currentProject = {};
        }

        $scope.elementType = VIEW_PATH + 'edit_executable_property_path.html';
        $scope.currentProperty = property;
      };

      // triggered by Edit Resource Property
      $scope.chooseResourceProject = function($item, $model) {
        var project = {};
        project.name = $item.name;
        project.access = $item.access;
        $scope.currentProject = $item;
        $scope.customProperty.project = project;
        $scope.customProperty.resourceName = '';
      };




      // Property Management
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
                    '<div class="col-md-4">' +
                    '<div class="radio"> <label for="type-string"> ' +
                    '<input type="radio" name="type" id="type-string" value="String" checked="checked"> ' +
                    'String </label> ' +
                    '</div>' + 
                    '<div class="radio"> <label for="type-boolean"> ' +
                    '<input type="radio" name="type" id="type-boolean" value="Boolean"> ' +
                    'Boolean </label> ' +
                    '</div>' +
                    '<div class="radio"> <label for="type-resource"> ' +
                    '<input type="radio" name="type" id="type-resource" value="Resource"> ' +
                    'Resource </label> ' +
                    '</div>' +
                    '<div class="radio"> <label for="type-path"> ' +
                    '<input type="radio" name="type" id="type-path" value="Path"> ' +
                    'Path </label> ' +
                    '</div>' +
                    '<div class="radio"> <label for="type-arraystring"> ' +
                    '<input type="radio" name="type" id="type-arraystring" value="ArrayString"> ' +
                    'Array (String)</label> ' +
                    '</div> ' +
                    '<div class="radio"> <label for="type-arrayresource"> ' +
                    '<input type="radio" name="type" id="type-arrayresource" value="ArrayResource"> ' +
                    'Array (Resource) </label> ' +
                    '</div>' +
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
        if (propertyType === 'ArrayString') {
          element[propertyName] = {};
          element[propertyName].propertyType = propertyType;
          element[propertyName].propertyValue = [];
        } else if (propertyType === 'ArrayResource') {
          element[propertyName] = {};
          element[propertyName].propertyType = propertyType;
          element[propertyName].propertyValue = [];
        } else if (propertyType === 'Resource') {
          element[propertyName] = {};
          element[propertyName].propertyType = propertyType;
        } else if (propertyType === 'Path') {
          element[propertyName] = {};
          element[propertyName].propertyType = propertyType;
        } else if (propertyType === 'Boolean') {
          element[propertyName] = {};
          element[propertyName].propertyType = propertyType;
          element[propertyName].propertyValue = true;
        } else {
          element[propertyName] = '';
        }

        loadCustomProperties(element);
        $scope.$apply();
      }

      $scope.addEntry = function(element, property) {
        hideAlert();
        if (property.propertyType === 'ArrayString') {
          element[property.propertyName].propertyValue.push('');
        } else if (property.propertyType === 'ArrayResource') {
          var res = {};
          if (element[property.propertyName].propertyValue.length > 0) {
            res.project = element[property.propertyName].propertyValue[0].project;
            res.resourceType = element[property.propertyName].propertyValue[0].resourceType;
          }
          element[property.propertyName].propertyValue.push(res);
        }
        loadCustomProperties(element);
      };

      $scope.deleteEntry = function(element, property, index) {
        hideAlert();
        element[property.propertyName].propertyValue.splice(index, 1);
        loadCustomProperties(element);
      };

      $scope.download = function () {
        // copy higher level descriptive properties to moduleDefinition
        module.moduleDefinition.name = module.moduleName;
        module.moduleDefinition.author = module.moduleAuthor;
        module.moduleDefinition.label = module.moduleLabel;

        // prepare export
        var exportModule = JSON.stringify(module.moduleDefinition);
        var filename = (module.moduleLabel) ? module.moduleLabel : module;

        download(exportModule, filename + '.json', 'text/plain'); // triggers file download (has issues on Safari)
      };

      $scope.ok = function () {
        if ($scope.elementType === VIEW_PATH + 'edit_executable_select.html') {
          $scope.returnTo('executable');
        } else if ($scope.elementType === VIEW_PATH + 'edit_executable_property.html') {
          $scope.returnTo('executable');
        } else if ($scope.elementType === VIEW_PATH + 'edit_executable_property_path.html') {
          $scope.returnTo('executable');
        } else {
          // copy higher level descriptive properties to moduleDefinition
          module.moduleDefinition.name = module.moduleName;
          module.moduleDefinition.author = module.moduleAuthor;
          module.moduleDefinition.label = module.moduleLabel;
          $modalInstance.close();
        }
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
