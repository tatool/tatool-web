'use strict';

angular.module('tatool.app')
  .factory('moduleCreatorService', ['$log', '$q', 'dataService', function ($log, $q, dataService) {
    $log.debug('ModuleCreatorService: initialized');

    var creator = {};

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
              creator.validateModule(deferred, contents);
            };
          })(file);

          r.readAsText(file);
        }

      } else {
        deferred.reject('The File APIs are not fully supported by your browser. Please update to a current browser.');
      }

      return deferred.promise;
    };

    // validate module file and save to db
    creator.validateModule = function(deferred, contents) {
      try {
        var moduleDefinition = JSON.parse(contents);

        // check if moduleDefinition is a proper object
        if (typeof moduleDefinition === 'object') {
          // create module object
          var newModule = new Module(moduleDefinition.id);
          newModule.setModuleName(moduleDefinition.name);
          newModule.setModuleAuthor(moduleDefinition.author);
          newModule.setModuleVersion(moduleDefinition.version);
          newModule.setModulePackageUrl(moduleDefinition.packageUrl);
          newModule.setModuleDefinition(moduleDefinition);

          // store module
          dataService.getModule(newModule.moduleId).then(
            function(data) {
              if (data !== undefined) {
                deferred.reject('The module with the id <b>\'' + newModule.moduleId + '\'</b> already exists.');
              } else {
                dataService.addModule(newModule).then(
                  function() {
                    deferred.resolve(newModule);
                  }, function(error) {
                    deferred.reject(error);
                  });
              }
            }, function(error) {
              deferred.reject(error);
            });
          
        } else {
          deferred.reject('Not a proper JSON file');
        }

      } catch (error) {
        deferred.reject('Syntax Error in module file: ' + error.message);
      }

    };

    return creator;

  }]);