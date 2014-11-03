'use strict';

angular.module('tatool.module')
  .service('tatoolExecutable', [ '$q', '$http', 'cfgModule', function ($q, $http, cfgModule) {

    var executable = {};

    var executor = {};

    var project = {};

    // initialize the common executable service
    executable.init = function(runningExecutor, moduleProject) {
      executor = runningExecutor;
      project = moduleProject;
    };

    // loading resources of project
    executable.getProjectResource = function(resourceType, resource) {
      var deferred = $q.defer();

      $http.get( project.path + resourceType + '/' + resource + '?token=' + project.token)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // returns empty constructor for an executable
    executable.createExecutable = function() {
      return function() { };
    };

    // stops the execution of the current executable
    executable.stopExecutable = function() {
      executor.stopExecutable();
    };

    return executable;
  }]);
