'use strict';

/* global Papa */

angular.module('tatool.module')
  .service('tatoolExecutable', [ '$q', '$http', function ($q, $http) {

    var executable = {};

    var executor = {};

    var project = {};

    var mode = '';

    /**--------------------------------
      General Executable functions
    -------------------------------- */
    // initialize the common executable service
    executable.init = function(runningExecutor, moduleProject, moduleMode) {
      executor = runningExecutor;
      project = moduleProject;
      mode = moduleMode;
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

    // fail the current executable and stop module
    executable.fail = function(error) {
      executor.failExecutable(error);
    };

    // stop the execution of the current module
    executable.stopModule = function(sessionComplete) {
      sessionComplete = (sessionComplete) ? sessionComplete : true;
      executor.finishExecutable();
      executor.stopModule(sessionComplete);
    };

    /**--------------------------------
      Timing Helper functions
    -------------------------------- */

    // provide the current time in sub-millisecond resolution and such that it is not subject to system clock skew or adjustments
    executable.getTiming = (function() {
      // Returns the number of milliseconds elapsed since either the browser navigationStart event or
      // the UNIX epoch, depending on availability.
      // Where the browser supports 'performance' we use that as it is more accurate (microsoeconds
      // will be returned in the fractional part) and more reliable as it does not rely on the system time.
      // Where 'performance' is not available, we will fall back to Date().getTime().
      var performance = window.performance || {};
      performance.now = (function() {
        return performance.now    ||
        performance.webkitNow     ||
        performance.msNow         ||
        performance.oNow          ||
        performance.mozNow        ||
        function() { return new Date().getTime(); };
      })();
      return performance.now();
    });

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

    // get a resource (project or external)
    executable.getResource = function(res) {
      if (res.project.access === 'external') {
        return getExternalResource(res.resourceName);
      } else {
        return getProjectResource(res);
      }
    };

    var getProjectResource = function(res) {
      var deferred = $q.defer();

      var path = '/' + mode + '/resources/' +  res.project.access + '/' + res.project.name + '/';

      $http.get( path + res.resourceType + '/' + res.resourceName + '?token=' + project.token)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    var getExternalResource = function(resUrl) {
      var deferred = $q.defer();

      $http.get(resUrl)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // get a resource (project or external)
    executable.getCSVResource = function(res, header) {
      if (res.project.access === 'external') {
        return getExternalCSVResource(res.resourceName, header);
      } else {
        return getProjectCSVResource(res, header);
      }
    };

    var getProjectCSVResource = function(res, header) {
      var deferred = $q.defer();
      if (!header) {
        header = false;
      }

      var path = '/' + mode + '/resources/' +  res.project.access + '/' + res.project.name + '/';

      $http.get( path + res.resourceType + '/' + res.resourceName + '?token=' + project.token)
        .success(function (data) {
          var csv = Papa.parse(data, {header: header, dynamicTyping: true});
          deferred.resolve(csv.data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    var getExternalCSVResource = function(resUrl, header) {
      var deferred = $q.defer();
      if (!header) {
        header = false;
      }

      $http.get(resUrl)
        .success(function (data) {
          var csv = Papa.parse(data, {header: header, dynamicTyping: true});
          deferred.resolve(csv.data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

/*
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
          var csv = Papa.parse(data, {header: header, dynamicTyping: true});
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
          var csv = Papa.parse(data, {header: header, dynamicTyping: true});
          deferred.resolve(csv.data);
        })
        .error(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };*/

    /**--------------------------------
      Stimuli Selection Helper functions
    -------------------------------- */

    // returns a random int out of the specified interval
    executable.getRandomInt = function(min, max) {
      return Math.floor(Math.random()*(max-min+1)+min);
    };

    // returns a random element of an array or random property of an object without replacement
    executable.getRandom = function(obj) {
      var index;
      if (Array.isArray(obj)) {
        if (obj.length === 0) {
          return null;
        } else {
          index = executable.getRandomInt(0, obj.length - 1);
          return obj.splice(index, 1)[0];
        }
      } else {
        var array = Object.keys(obj);
        if (array.length === 0) {
          return null;
        } else {
          index = executable.getRandomInt(0, array.length - 1);
          var property = obj[array[index]];
          delete obj[array[index]];
          return property;
        }
      }
    };

    // returns a random element of an array or random property of an object with replacement
    executable.getRandomReplace = function(obj) {
      var index;
      if (Array.isArray(obj)) {
        if (obj.length === 0) {
          return null;
        } else {
          index = executable.getRandomInt(0, obj.length - 1);
          return obj[index];
        }
      } else {
        var array = Object.keys(obj);
        if (array.length === 0) {
          return null;
        } else {
          index = executable.getRandomInt(0, array.length - 1);
          return obj[array[index]];
        }
      }
    };

    // returns the next element of an array or next property of an object with replacement
    executable.getNext = function(obj, counter) {
      if (Array.isArray(obj)) {
        if (obj.length === 0) {
          return null;
        } else {
          return obj[counter];
        }
      } else {
        var array = Object.keys(obj);
        if (array.length === 0) {
          return null;
        } else {
          return obj[array[counter]];
        }
      }
    };

    // Shuffle array using Fisher-Yates algorithm
    executable.shuffle = function(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    };

    return executable;
  }]);
