'use strict';

import bootbox from 'bootbox';

import download from '../common/util/download.js';

EditCtrl.$inject = ['$scope', '$q', '$uibModalInstance', '$sce', '$compile', '$uibModal', '$log', 'module', 'moduleDataService'];

function EditCtrl($scope, $q, $uibModalInstance, $sce, $compile, $uibModal, $log, module, moduleDataService) {

      var PROTECTED_PROPERTIES = ['tatoolType', 'customType', 'name', 'blankInterval', 'fixationInterval', 'status', 'project', 'hideMouseCursor'];

      $scope.resourceTypes = ['stimuli', 'instructions'];

      $scope.module = module;
      $scope.element = {};
      $scope.elementIndex = {};
      $scope.elementParent = {};

      $scope.highlightId = {key: 'module'};

      $scope.alert = {};
      $scope.elementType = 'edit_module.html';
      $scope.projects = [];
      $scope.executables = [];

      $scope.trustAsHtml = function(value) {
        return $sce.trustAsHtml(value);
      };

      $scope.openModule = function() {
        hideAlert();
        $scope.highlightId.key = 'module';
        $scope.elementType = 'edit_module.html';
      };

      $scope.openElement = function(element, index, parent) {
        hideAlert();
        $scope.element = element;
        $scope.elementIndex = index;
        $scope.elementParent = parent;
        $scope.customProperties = [];

        if (element.tatoolType === 'List' || element.tatoolType === 'Dual') {
          $scope.elementType = 'edit_list.html';
        } else if (element.tatoolType === 'Executable') {
          // prepare custom properties
          loadCustomProperties(element, 'executable');
          $scope.elementType = 'edit_executable.html';
        }
      };

      // populate scope variable with custom properties (executable or handler properties)
      function loadCustomProperties(element) {
        $scope.customProperties = [];
        angular.forEach(element, function(value, key) {
          if (key.substring(0,1) !== '$') {
            var obj = {};
            if (PROTECTED_PROPERTIES.indexOf(key) === -1) {
              obj.propertyName = key;
              obj.propertyType = value.propertyType; 
              $scope.customProperties.push(obj);
            }
          }
        });
      }

      function addCustomPropertiesFromProject(element) {
        if ($scope.currentExecutable.customProperties) {
          for (var i = 0; i < $scope.currentExecutable.customProperties.length; i++) {
            var customProperty = $scope.currentExecutable.customProperties[i];
            if (!(customProperty.propertyName in element)) {
              insertProperty(element, customProperty.propertyName, customProperty.propertyType);
            }
          }
        }
      }

      // checks whether a property name already exists
      function customPropertyExists(propertyName) {
        var exists = false;
        angular.forEach($scope.customProperties, function(value) {
          if (value.propertyName === propertyName) {
            exists = true;
          } 
        });
        return exists;
      }

      // filters valid exporter in editor
      $scope.filterValidExporter = function(exporter) {
        if (exporter.mode === 'upload' || exporter.mode === 'download') {
          return true;
        } else {
          return false;
        }
      };


      $scope.addNewExecutable = function(element) {
        hideAlert();
        var elementName = (Math.random().toString(36)+'00000000000000000').slice(2,16+2);
        var executable = {
          'tatoolType': 'Executable',
          'customType': '',
          'name': elementName,
          'blankInterval': 0,
          'fixationInterval': 0
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
          'name': (Math.random().toString(36)+'00000000000000000').slice(2,16+2),
          'iterator': { 'customType' : 'ListIterator', 'numIterations' : 1, 'order' : 'sequential' },
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
          'name': (Math.random().toString(36)+'00000000000000000').slice(2,16+2),
          'iterator': { 'customType' : 'ListIterator', 'numIterations' : 1, 'order' : 'sequential'  },
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
      };

      $scope.deleteElement = function(element, index, parent) {
        hideAlert();

        function runDelete() {
          if (parent) {
            if (parent.tatoolType === 'Dual') {
              delete parent.children[index];
              $scope.elementType = 'edit_module.html';
              $scope.highlightId.key = 'module';
            } else {
              parent.children.splice(index, 1);
              $scope.elementType = 'edit_module.html';
              $scope.highlightId.key = 'module';
            }
            $scope.$apply();
          }
        }

      bootbox.dialog({
          message: 'Are you sure you want to delete this Element and all of its child Elements?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'OK',
              className: 'btn-default',
              callback: runDelete
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          }
        });

      };

      function getProjects() {
        moduleDataService.getProjects().then(function(data) {
          $scope.projects = data;
          $scope.projects.push({ access: 'external', name: 'External Resource', description: 'Allows you to provide a complete URL.' });
        }, function(err) {
          $log.error(err);
        });
      }

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
            for (var j=0; j < $scope.currentProject.executables.length; j++) {
              if ($scope.currentProject.executables[j].customType === $scope.element.customType) {
                $scope.currentExecutable = $scope.currentProject.executables[j];
                break;
              }
            }
          }
        }

        $scope.elementType = 'edit_executable_select.html';
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
      $scope.chooseProject = function($item) {
        var project = {};
        project.name = $item.name;
        project.access = $item.access;
        $scope.element.project = project;
        $scope.element.customType = '';
        $scope.currentProject = $item;
        $scope.currentExecutable = {};
      };

      // triggered by Select Executable
      $scope.chooseExecutable = function($item) {
        var customType = $item.customType;
        $scope.element.customType = customType;
        $scope.currentExecutable = $item;
      };

      $scope.returnTo = function(string) {
        if (string === 'executable') {
          $scope.elementType = 'edit_executable.html';
        } else if (string === 'element') {
          $scope.elementType = 'edit_list.html';
        } else if (string === 'handler') {
          $scope.elementType = 'edit_handler.html';
        } else if (string === 'module') {
          $scope.elementType = 'edit_module.html';
        }
      };



      /*******************/
      // EXECUTABLE PROPERTY METHODS
      /*******************/

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

        $scope.elementType = 'edit_executable_property.html';
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

        $scope.elementType = 'edit_executable_property_path.html';
        $scope.currentProperty = property;
      };

      // triggered by Edit Resource Property
      $scope.chooseResourceProject = function($item) {
        var project = {};
        project.name = $item.name;
        project.access = $item.access;
        $scope.currentProject = $item;
        $scope.customProperty.project = project;
        $scope.customProperty.resourceName = '';
      };


      /*******************/
      // GENERIC PROPERTY METHODS
      /*******************/
      $scope.deleteProperty = function(element, property, context) {
        hideAlert();
        delete element[property.propertyName];
        loadCustomProperties(element, context);
      };

      $scope.addProperty = function(element, context) {
        hideAlert();
        var box = bootbox.dialog({
          title: '<b>Add new Property</b>',
          message: '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                    '<form class="form-horizontal"> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Property Name *</label> ' +
                    '<div class="col-md-4"> ' +
                    '<input id="newPropertyName" name="newPropertyName" type="text" class="form-control input-md"> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="type">Property Type *</label> ' +
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
                  setAlert('danger', 'Invalid or missing Property name. Please use lowerCamelCase notation for custom Property names.');
                  $scope.$apply();
                } else if ( (PROTECTED_PROPERTIES.indexOf(propertyName) !== -1) || customPropertyExists(propertyName) ) {
                  setAlert('danger', 'Property name is protected or already in use. Please use a different name.');
                  $scope.$apply();
                } else {
                  insertProperty(element, propertyName, propertyType, context);
                  refreshProperties(element);
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

      function refreshProperties(element) {
        loadCustomProperties(element);
        $scope.$apply();
      }

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
      }

      $scope.addEntry = function(element, property, context) {
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
        loadCustomProperties(element, context);
      };

      $scope.deleteEntry = function(element, property, index, context) {
        hideAlert();
        element[property.propertyName].propertyValue.splice(index, 1);
        loadCustomProperties(element, context);
      };

      /*******************/
      // HANDLER METHODS
      /*******************/

      $scope.deleteHandler = function(element, handler, index) {
        hideAlert();
        element.handlers.splice(index, 1);
      };

      $scope.addHandler = function(element) {
        hideAlert();
        var box = bootbox.dialog({
          title: '<b>Add new Handler</b>',
          message: '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                    '<form class="form-horizontal"> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="name">Handler Name *</label> ' +
                    '<div class="col-md-4"> ' +
                    '<input id="newHandlerName" name="newHandlerName" type="text" class="form-control input-md"> ' +
                    '</div> ' +
                    '</div> ' +
                    '<div class="form-group"> ' +
                    '<label class="col-md-4 control-label" for="type">Handler Type *</label> ' +
                    '<div class="col-md-7">' +
                    '<div class="radio"> <label for="trialCountHandler"> ' +
                    '<input type="radio" name="type" id="trialCountHandler" value="trialCountHandler" checked="checked"> ' +
                    'Trial Counter for Status Panel (trialCountHandler) </label> ' +
                    '</div>' +
                    '<div class="radio"> <label for="levelHandler"> ' +
                    '<input type="radio" name="type" id="levelHandler" value="levelHandler"> ' +
                    'Level Algorithm for Status Panel (levelHandler) </label> ' +
                    '</div>' +
                    '</div> </div>' +
                    '</form> </div>  </div>',
          buttons: {
            main: {
              label: 'Ok',
              className: 'btn-default',
              callback: function () {
                var handlerName = $('#newHandlerName').val();
                var handlerType = $('input[name=\'type\']:checked').val();
                if (!handlerName || handlerName === '' || handlerName.indexOf(' ') >= 0 || !isNaN(parseInt(handlerName))) {
                  setAlert('danger', 'Invalid or missing Handler name. Please use lowerCamelCase notation for Handler names.');
                  $scope.$apply();
                } else {
                  insertHandler(element, handlerName, handlerType);
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
          $('#newHandlerName').focus();
        });

        $('#newHandlerName').keypress(function(e) {
          if(e.which === 13) {
            e.preventDefault();
            $('button[data-bb-handler="main"]').focus().click();
          }
        });
      };

      function insertHandler(element, handlerName, handlerType) {
        if (!element.handlers) {
          element.handlers = [];
        }
        var handler = {};
        handler.name = handlerName;
        handler.customType = handlerType;
        element.handlers.push(handler);
        $scope.$apply();
      }

      $scope.editHandler = function(handler) {
        $scope.handler = handler;
        loadCustomProperties(handler, 'handler');
        $scope.elementType = 'edit_handler.html';
      };

      $scope.editHandlerProperty = function(handler, property, $index) {
        $scope.currentProject = {};
        $scope.customProperty = {};
        if ($index >= 0) {
          $scope.customProperty = handler[property.propertyName].propertyValue[$index];
        } else {
          $scope.customProperty = handler[property.propertyName];
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

        $scope.elementType = 'edit_handler_property.html';
        $scope.currentProperty = property;
      };

      $scope.editHandlerPathProperty = function(handler, property, $index) {
        $scope.customProperty = {};
        if ($index >= 0) {
          $scope.customProperty = handler[property.propertyName].propertyValue[$index];
        } else {
          $scope.customProperty = handler[property.propertyName];
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

        $scope.elementType = 'edit_handler_property_path.html';
        $scope.currentProperty = property;
      };


      /*******************/
      // GENERAL METHODS
      /*******************/

      $scope.download = function () {
        // copy higher level descriptive properties to moduleDefinition
        module.moduleDefinition.name = module.moduleName;
        module.moduleDefinition.author = module.moduleAuthor;
        module.moduleDefinition.label = module.moduleLabel;
        module.moduleDefinition.description = module.moduleDescription;
        module.moduleDefinition.exportDelimiter = module.exportDelimiter;
        module.moduleDefinition.exportFormat = module.exportFormat;
        module.moduleDefinition.moduleMaxSessions = module.moduleMaxSessions;

        // prepare export
        var exportModule = JSON.stringify(module.moduleDefinition);
        var filename = (module.moduleLabel) ? module.moduleLabel : module;

        download(exportModule, filename + '.json', 'text/plain'); // triggers file download (has issues on Safari)
      };

      $scope.saveAndBack = function () {
        if ($scope.elementType === 'edit_executable_select.html') {
          addCustomPropertiesFromProject($scope.element);
          loadCustomProperties($scope.element);
          $scope.returnTo('executable');
        } else if ($scope.elementType === 'edit_executable_property.html') {
          $scope.returnTo('executable');
        } else if ($scope.elementType === 'edit_executable_property_path.html') {
          $scope.returnTo('executable');
        } else if ($scope.elementType === 'edit_handler.html') {
          $scope.returnTo('element');
        } else if ($scope.elementType === 'edit_handler_property.html') {
          $scope.returnTo('handler');
        } else if ($scope.elementType === 'edit_handler_property_path.html') {
          $scope.returnTo('handler');
        } 
      };

      $scope.ok = function () {
        if (!validateModule()) {
          // invalid module
        } else {
          // copy higher level descriptive properties to moduleDefinition
          module.moduleDefinition.name = module.moduleName;
          module.moduleDefinition.author = module.moduleAuthor;
          module.moduleDefinition.label = module.moduleLabel;
          module.moduleDefinition.description = module.moduleDescription;
          module.moduleDefinition.exportDelimiter = module.exportDelimiter;
          module.moduleDefinition.exportFormat = module.exportFormat;
          module.moduleDefinition.moduleMaxSessions = module.moduleMaxSessions;
          $uibModalInstance.close();
        }
      };

      // module validation functions
      // general settings that will have to be set manually by the user before being able to save
      function validateModule() {
        if (!module.moduleName || module.moduleName === '') {
          $scope.returnTo('module');
          $scope.highlightId.key = 'module';
          setAlert('danger', 'A Module Name is required.');
          $('#moduleName').focus();
          return false;
        } else if (!module.moduleAuthor || module.moduleAuthor === '') {
          $scope.returnTo('module');
          $scope.highlightId.key = 'module';
          setAlert('danger', 'A Module Author is required.');
          $('#moduleAuthor').focus();
          return false;
        } else if (!module.moduleLabel || module.moduleLabel === '') {
          $scope.returnTo('module');
          $scope.highlightId.key = 'module';
          setAlert('danger', 'Please enter a valid Module Label (alphanumeric characters and no whitespace).');
          $('#moduleLabel').focus();
          return false;
        } else {
          validateHierarchy(module.moduleDefinition.moduleHierarchy);
          return true;
        }
      }

      // add default values for mandatory properties if not provided
      function validateHierarchy(element) {
        if (element.tatoolType === 'List' || element.tatoolType === 'Dual') {

          // add default numIterations of 1
          if(!element.iterator.numIterations || element.iterator.numIterations === '') {
            element.iterator.numIterations = 1;
          } 

          // add default order to sequential
          if(element.tatoolType === 'List' && (!element.iterator.order || element.iterator.order === '')) {
            element.iterator.order = 'sequential';
          } 

          // add default handler names if not provided
          if (element.handlers && element.handlers.length > 0) {
            for (var i = 0; i < element.handlers.length; i++) {
              if(!element.handlers[i].name || element.handlers[i].name === '') {
                element.handlers[i].name = (Math.random().toString(36)+'00000000000000000').slice(2,16+2);
              }
            }
          }

          angular.forEach(element.children, function(value) {
            validateHierarchy(value);
          });
        } else if (element.tatoolType === 'Executable') {

          // add default executable name if not provided
          if(!element.name || element.name === '') {
            element.name = (Math.random().toString(36)+'00000000000000000').slice(2,16+2);
          }
        }
      }

      $scope.cancel = function () {
        function dismiss() {
          $uibModalInstance.dismiss('cancel');
        }

        bootbox.dialog({
          message: 'Are you sure you want to exit without saving your changes?',
          title: '<b>Tatool</b>',
          buttons: {
            ok: {
              label: 'Yes',
              className: 'btn-default',
              callback: dismiss
            },
            cancel: {
              label: 'No',
              className: 'btn-default'
            }
          }
        });
      };

      var setAlert = function(alertType, alertMessage) {
        $scope.alert = {};
        $scope.alert.type = alertType;
        $scope.alert.msg = $sce.trustAsHtml(alertMessage);
        $scope.alert.visible = true;
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      };

      var hideAlert = function() {
        $scope.alert = {};
        $scope.alert.visible = false;
        $scope.alert.msg = '';
      };

      $scope.hideAlert = hideAlert;

}

export default EditCtrl;