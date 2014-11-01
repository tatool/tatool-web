'use strict';

angular.module('tatool.module')
  .service('executableService', ['$log', '$rootScope', '$injector', '$q', '$http', '$templateCache', 'contextService', 'tatoolPhase', 'tatoolExecutable', 'moduleService', 'cfgModule',
    function ($log, $rootScope, $injector, $q, $http, $templateCache, contextService, tatoolPhase, tatoolExecutable, moduleService, cfgModule) {

    var executableService = {};

    var executables = {};

    var numExecutables = 0;

    var projectUrl = cfgModule.MODULE_PROJECT_URL;

    // reset the list of executables
    executableService.init = function(runningExecutor) {
      executables = {};
      numExecutables = 0;

      // override project Url with url given in module
      var url = moduleService.getProjectUrl();
      if (url) {
        projectUrl = url;
      }

      // clean up url so we always have a trailing slash
      if (projectUrl.indexOf('/', projectUrl.length - 1) === -1) {
        projectUrl = projectUrl + '/';
      } else {
        projectUrl = projectUrl;
      }

      tatoolExecutable.init(runningExecutor, projectUrl);
    };

    // create a new executable from service and register
    executableService.addExecutable = function(executableJson) {
      var deferred = $q.defer();
      var self = this;

      var projectPath = projectUrl;
      var libraryPath = cfgModule.MODULE_LIBRARY_EXECUTABLE_URL;
      var executableName = executableJson.customType;
      var executableSrv = executableName + '.service.js';
      var executableCtrl = executableName + '.ctrl.js';
      var executableStyle = executableName + '.css';
      var executableTpl = executableName + '.html';

      // every executable consists of [*service,*controller,style] (* required)
      var dependencies = function(path) {
        var files = [], srv = {}, ctrl = {}, style = {};
        srv[executableSrv] = path + executableSrv;
        ctrl[executableCtrl] = path + executableCtrl;
        style[executableStyle] = path + executableStyle;
        files.push(style);
        files.push(srv);
        files.push(ctrl);
        return files;
      }

      // $script loader
      /*return [
          path + executableSrv,
          path + executableCtrl
        ];*/
      
      // try first in package folder and use library as fallback to allow override of executables
      $http.get(projectPath + executableSrv)
        .success(function () {
          //$script(dependencies(projectPath), executableName);
          head.load( dependencies(projectPath) );
          $http.get(projectPath + executableTpl).then( function(template) {
            $templateCache.put(executableTpl, template.data);
          });
        })
        .error(function () {
          //$script(dependencies(libraryPath), executableName);
          head.load( dependencies(libraryPath) );
          $http.get(libraryPath + executableTpl).then(function(template) {
            $templateCache.put(executableTpl, template.data);
          });
        });
   
      // Create executable once scripts are loaded
      head.ready(executableCtrl, function() {
      //$script.ready(executableName, function() {
        try {
          var ExecutableService = $injector.get(executableName);
          var executable = new ExecutableService();
          angular.extend(executable, executableJson);
          self.registerExecutable(executable.name, executable);
          deferred.resolve(executable);
        } catch (e) {
          deferred.reject('Unable to find executable: ' + executableName + ' (' + executableSrv + ')');
        }
      });

      return deferred.promise;
    };

    // register a handler
    executableService.registerExecutable = function(name, executable) {
      executables[name] = executable;
      numExecutables++;
    };

    // get a specific handler
    executableService.getExecutable = function(name) {
      return executables[name];
    };

    // run init method on all executables (preloading)
    executableService.initAllExecutables = function() {
      var deferred = $q.defer();
      var i = 0;
      var promises = [];

      for (var key in executables) {
        i++;
        runInit(key, i, deferred, promises);
      }

      return deferred.promise;
    };

    var runInit = function(key, i, initAllDeferred, promises) {
      if ('init' in executables[key]) {
        var deferred = executables[key].init();

        if (deferred && deferred.promise) {
          promises.push(deferred.promise);
        }
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
  }]);
