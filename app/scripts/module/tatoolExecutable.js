'use strict';

/* global Papa */

angular.module('tatool.module')
  .service('tatoolExecutable', [ '$q', '$http', function ($q, $http) {

    var executable = {};

    var executor = {};

    var project = {};

    /**--------------------------------
      General Executable functions
    -------------------------------- */
    // initialize the common executable service
    executable.init = function(runningExecutor, moduleProject) {
      executor = runningExecutor;
      project = moduleProject;
    };

    // returns empty constructor for an executable
    executable.createExecutable = function() {
      return function() { };
    };

    // stops the execution of the current executable
    executable.stop = function() {
      executor.stopExecutable();
    };

    // suspend the current executable
    executable.suspend = function() {
      executor.suspendExecutable();
    };

    // stop the execution of the current module
    executable.stopModule = function(sessionComplete) {
      sessionComplete = (sessionComplete) ? sessionComplete : true;
      executor.finishExecutable();
      executor.stopModule(sessionComplete);
    };

    /**--------------------------------
      Resource Loading Helper functions
    -------------------------------- */
    // returns the project path
    executable.getProjectPath = function(resourceType) {
      if (resourceType) {
        return project.path + resourceType + '/';
      } else {
        return project.path;
      }
    };

    // returns the currently valid resource token
    executable.getResourceToken = function() {
      return project.token;
    };

    // get full path to a specific project resource
    executable.getResourcePath = function(resourceType, resourceName) {
      return project.path + resourceType + '/' + resourceName + '?token=' + project.token;
    };

    // check whether path is external or project specific
    executable.isProjectResource = function(path) {
      if (path.substring(0, 4) === 'http' || path.substring(0, 3) === 'www') {
        return false;
      } else {
        return true;
      }
    };

    // loading resource of project and returning raw data
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

    // loading project CSV resource and return array
    executable.getProjectCSV = function(resourceType, resource, header) {
      var deferred = $q.defer();
      if (!header) {
        header = false;
      }

      $http.get( project.path + resourceType + '/' + resource + '?token=' + project.token)
        .success(function (data) {
          var csv = Papa.parse(data, {header: header});
          deferred.resolve(csv.data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // loading external resource and returning raw data
    executable.getExternalResource = function(resourceUrl) {
      var deferred = $q.defer();

      $http.get(resourceUrl)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // loading external CSV resource and return array
    executable.getExternalCSV = function(resource, header) {
      var deferred = $q.defer();
      if (!header) {
        header = false;
      }
      $http.get(resource)
        .success(function (data) {

          console.log(data);
          var csv = Papa.parse(data, {header: header});
          deferred.resolve(csv.data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    /**--------------------------------
      Randomisation Helper functions
    -------------------------------- */
    // returns a random int out of the specified interval
    executable.getRandomInt = function(min, max) {
      return Math.floor(Math.random()*(max-min+1)+min);
    };

    // returns a random element of an array or random property of an object
    executable.pickRandom = function(obj) {
      var index;
      if (Array.isArray(obj)) {
        index = executable.getRandomInt(0, obj.length - 1);
        return obj[index];
      } else {
        var array = Object.keys(obj);
        index = executable.getRandomInt(0, array.length - 1);
        return obj[array[index]];
      }
    };

    return executable;
  }]);
