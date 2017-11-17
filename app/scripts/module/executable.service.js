'use strict';

/* global async */
/* global head */

import async from 'async';
import 'headjs/dist/1.0.0/head.load.min.js'

ExecutableService.$inject = ['$log', '$rootScope', '$injector', '$q', '$http', '$templateCache', '$window', 'contextService', 'tatoolPhase', 'executableUtils', 'moduleService', 'cfgModule'];

function ExecutableService($log, $rootScope, $injector, $q, $http, $templateCache, $window, contextService, tatoolPhase, executableUtils, moduleService, cfgModule) {

    var executableService = {};

    var executables = {};

    var numExecutables = 0;

    var mode = '';

    var moduleProject = {};

    var token = '';

    // initialize executable service by requesting a resource token from the API. The token will be used to request project resources from Tatool.
    // At the same time we're also preloading any tatool specific resources
    executableService.init = function(runningExecutor) {
      var deferred = $q.defer();

      executables = {};
      numExecutables = 0;
      mode = $window.sessionStorage.getItem('mode');

      // set default module project (static)
      moduleProject = {};
      moduleProject.name = (moduleProject.name) ? moduleProject.name : cfgModule.MODULE_DEFAULT_PROJECT;
      moduleProject.access = (moduleProject.access) ? moduleProject.access : 'public';

      // get session token to access resources and save to executableUtils
      var tokenUrl = '/api/' + mode + '/modules/' + moduleService.getModuleId() + '/resources/token';

      $http.get(tokenUrl)
        .success(function (data) {
          token = '?' + 'token=' + data.token;
          moduleProject.token = data.token;
          moduleProject.path = '/' + mode + '/resources/' +  moduleProject.access + '/' + moduleProject.name + '/';
          executableUtils.init(runningExecutor, data.token, mode);
          moduleService.setSessionToken(data.token);

          initializeTatoolResources().then(function() {
            deferred.resolve();
          }, function(error) {
            $log.error(error);
            deferred.reject(error);
          });
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // preload tatool templates
    var initializeTatoolResources = function() {
      var deferred = $q.defer();

      var preload = function(item, cb) {
        $http.get(item).success( function(template) {
          $templateCache.put(item, template);
          cb();
        }).error( function(error) {
          cb(error);
        });
      };

      // loop through resources
      async.each(cfgModule.MODULE_RESOURCES, preload, function(err) {
        if (err) {
          $log.error(err);
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    };

    // create a new executable from service and register
    executableService.addExecutable = function(executableJson) {
      var deferred = $q.defer();
      var self = this;

      // check if executable project is given, otherwise use default
      var project = {};
      if (executableJson.project) {
        project.access = executableJson.project.access;
        project.name = executableJson.project.name;
      } else {
        project.access = moduleProject.access;
        project.name = moduleProject.name;
      }

      var projectPath = '/' + mode + '/resources/' +  project.access + '/' + project.name + '/executables/';
      var defaultProjectPath = '/' + mode + '/resources/public/' + cfgModule.MODULE_DEFAULT_PROJECT + '/executables/';
      var executableName = executableJson.customType;
      var executableSrv = executableName + '.service.js';
      var executableCtrl = executableName + '.ctrl.js';
      var executableStyle = executableName + '.css';
      var executableTpl = executableName + '.html';

      // every executable consists of [*service,*controller,style] (* required)
      var dependencies = function(path) {
        var files = [], srv = {}, ctrl = {}, style = {};
        srv[executableSrv] = path + executableSrv + token;
        ctrl[executableCtrl] = path + executableCtrl + token;
        style[executableStyle] = path + executableStyle + token;
        files.push(style);
        files.push(srv);
        files.push(ctrl);
        return files;
      };

      // try first in project folder and use default project as fallback to allow override of executables
      var templatePath = '';

      $http.get( projectPath + executableSrv + token)
        .success(function () {
          head.load( dependencies(projectPath) );
          templatePath = projectPath + executableTpl + token;
        })
        .error(function () {
          head.load( dependencies(defaultProjectPath) );
          templatePath = defaultProjectPath + executableTpl + token;
        });
   
      // Create executable once scripts are loaded
      head.ready(executableCtrl, function() {
        try {
          var ExecutableService = $injector.get(executableName);
          var executable = new ExecutableService();
          angular.extend(executable, executableJson);
          self.registerExecutable(executable.name, executable);

          // load html template of executable and add to templateCache with prefix
          $http.get(templatePath).success( function(template) {
            $templateCache.put('executables/' + executableTpl, template);
            deferred.resolve(executable);
          }).error( function(error) {
            deferred.reject(error);
          });
        } catch (e) {
          $log.error(e);
          deferred.reject('Unable to find executable: ' + executableName + ' (' + executableSrv + ')');
        }
      });

      return deferred.promise;
    };

    // register an executable
    executableService.registerExecutable = function(name, executable) {
      // make sure we don't overwrite an existing executable
      if (!(name in executables)) {
        executables[name] = executable;
        numExecutables++;
      }
    };

    // get a specific executable
    executableService.getExecutable = function(name) {
      return executables[name];
    };

    // run init method on all executables (preloading)
    executableService.initAllExecutables = function() {
      var deferred = $q.defer();
      var i = 0;
      var promises = [];

      if (Object.keys(executables).length > 0) {
        for (var key in executables) {
          i++;
          runInit(key, i, deferred, promises);
        }
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    // run init method on executable
    var runInit = function(key, i, initAllDeferred, promises) {
      if ('init' in executables[key]) {
        var deferred = executables[key].init();

        if (deferred && deferred.promise) {
          promises.push(deferred.promise);
        }
      } else {
        initAllDeferred.reject('Executable Service with name \'' + key + '\' is missing the mandatory \'init\' method.');
      }

      if (i === numExecutables) {
        $q.all(promises).then(function() {
            initAllDeferred.resolve();
          }, function(error) {
            initAllDeferred.reject(error);
          });
      }
    };

    // informs all executables
    executableService.informAllExecutables = function(phase) {
      for (var key in executables) {
        if ('processPhase' in executables[key]) {
          executables[key].processPhase(phase);
        }
      }
    };

    // informs all executables in current elementStack
    executableService.informExecutablesInStack = function(phase) {
      var elementStack = contextService.getProperty('elementStack');
      for (var i = 0; i < elementStack.length; i++) {
        var currentElement = elementStack[i];
        if ('tatoolType' in currentElement && currentElement.tatoolType === 'Executable' && 'processPhase' in executables[currentElement.name]) {
          executables[currentElement.name].processPhase(phase);
        }
      }
    };

    // listen to broadcast events on $rootScope and inform executables
    $rootScope.$on(tatoolPhase.SESSION_START, function(arg) {
      executableService.informAllExecutables(arg.name);
    });
    $rootScope.$on(tatoolPhase.EXECUTABLE_START, function(arg, stack) {
      executableService.informExecutablesInStack(arg.name, stack.displayAll());
    });
    $rootScope.$on(tatoolPhase.EXECUTABLE_END, function(arg, stack) {
      executableService.informExecutablesInStack(arg.name, stack.displayAll());
    });
    $rootScope.$on(tatoolPhase.SESSION_END, function(arg) {
      executableService.informAllExecutables(arg.name);
    });

    return executableService;
}

export default ExecutableService;
