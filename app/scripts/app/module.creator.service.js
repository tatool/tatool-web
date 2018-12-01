'use strict';

import uuidv4  from 'uuid/v4';

import Module from '../common/module.pojo.js';

ModuleCreatorService.$inject = ['$log', '$q', 'moduleDataService'];

function ModuleCreatorService($log, $q, moduleDataService) {
    $log.debug('ModuleCreatorService: initialized');

    var creator = {};

    var isValid = true;
    var validationResult = '';
    var elementNr = 0;

    // upload module file with HTML5 File API
    creator.loadLocalModule = function(file) {
      var deferred = $q.defer();

      // Check for the various File API support.
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        if (!file) {
          deferred.reject('Failed to load file');
        } else {
          var r = new FileReader();
          r.onload = (function () {
            return function (e) {
              var contents = e.target.result;
              creator.createModule(deferred, contents);
            };
          })(file);

          r.readAsText(file);
        }

      } else {
        deferred.reject('The File APIs are not fully supported by your browser. Please update to a current browser.');
      }

      return deferred.promise;
    };

    // install a module from the repository
    creator.loadOnlineModule = function(module) {
      var deferred = $q.defer();
      creator.createModule(deferred, module);
      return deferred.promise;
    };

    // validate module file and save to db
    creator.createModule = function(deferred, contents) {
      try {
        var moduleDefinition = contents;
        if (typeof contents !== 'object') {
          moduleDefinition = JSON.parse(contents);
        }

        // check if moduleDefinition is a proper object
        if (typeof moduleDefinition === 'object') {

          // validate file for required properties
          isValid = true;
          validationResult = '';
          elementNr = 0;
          validateDefinition(moduleDefinition);


          if (!isValid) {
            deferred.reject('Validation of module file failed. <br><br><b>' + validationResult + '</b>');
          } else {
            // create module object
            var newModule = new Module(uuidv4());
            newModule.setModuleName(moduleDefinition.name);
            newModule.setModuleAuthor(moduleDefinition.author);
            newModule.setModuleDefinition(moduleDefinition);
            newModule.setModuleLabel(moduleDefinition.label);
            newModule.setModuleDescription(moduleDefinition.description);
            newModule.setExportDelimiter(moduleDefinition.exportDelimiter);
            newModule.setExportFormat(moduleDefinition.exportFormat);
            newModule.setModuleMaxSessions(moduleDefinition.moduleMaxSessions);
            newModule.setModuleVersion(1);

            // store module
            moduleDataService.addModule(newModule).then( function() {
                deferred.resolve(newModule);
              }, function(error) {
                deferred.reject(error);
              });
          }
        } else {
          deferred.reject('Not a proper JSON file');
        }

      } catch (error) {
        $log.error('Error: creating module file due to ', error);
        deferred.reject('Syntax Error in module file: ' + error.message);
      }

    };

    // Basic validation of required properties for the module definition
    function validateDefinition(definition) {
      if (!('name' in definition)) {
        validationMessage('Missing property \'name\' on module definition.', null, definition);
      }
      if (!('moduleHierarchy' in definition)) {
        validationMessage('Missing property \'moduleHierarchy\' on module definition.', null, definition);
      }
      validateHierarchy(definition.moduleHierarchy);
    }

    // Basic validation of required properties for the module hierarchy
    function validateHierarchy(element) {
      elementNr++;
      // every element needs to have a tatoolType
      if ('tatoolType' in element) {
        // List / Dual rules
        if (element.tatoolType === 'List' || element.tatoolType === 'Dual') {
          if(!('iterator' in element)) {
            validationMessage(null, 'iterator');
          } else {
            if ((element.iterator instanceof Array)) {
              validationMessage('Expecting the iterator property to be of type Object.', null, element);
            } else {
              if (!('customType' in element.iterator)) {
                validationMessage(null, 'customType');
              }
            }
          }
          if(!('children' in element)) {
            validationMessage(null, 'children', element);
          } else {
            angular.forEach(element.children, function(value) {
              validateHierarchy(value);
            });
          }
          // List rules
          if (element.tatoolType === 'List') {
            if (!(element.children instanceof Array)) {
              validationMessage('Expecting the children property to be of type Array.', null, element);
            }
          }
          // Dual rules
          if (element.tatoolType === 'Dual') {
            if ((element.children instanceof Array)) {
              validationMessage('Expecting the children property to be of type Object.', null, element);
            }
            if(!('primary' in element.children)) {
              validationMessage(null, 'primary', element.children);
            }
            // secondary not required
          }
          // Executable rules
        } else if (element.tatoolType === 'Executable') {
          if(!('customType' in element)) {
            validationMessage(null, 'customType', element);
          }
          if(!('name' in element)) {
            validationMessage(null, 'name', element);
          }
        } else {
          validationMessage('Unknown tatoolType.', null, element);
        }
      } else {
        validationMessage(null, 'tatoolType', element);
      }
    }

    function validationMessage(text, propertyName, element) {
      if (propertyName !== null) {
        validationResult += '<li>Missing property \'' + propertyName + '\'' + ' (Element ' + elementNr + ')</li>';
        $log.error('Missing property \'' + propertyName + '\' on element ', JSON.stringify(element));
      } else {
        validationResult += '<li>' + text + ' (Element ' + elementNr + ')</li>';
        $log.error(text, (element !== null) ? JSON.stringify(element) : '');
      }
      isValid = false;
    }

    return creator;

}

export default ModuleCreatorService;