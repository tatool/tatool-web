'use strict';

angular.module('tatool.module')
  .service('executableService', ['$log', '$rootScope', '$injector', 'contextService', 'tatoolPhase',
    function ($log, $rootScope, $injector, contextService, tatoolPhase) {

    var executableService = {};

    var executables = {};

    // reset the list of executables
    executableService.init = function() {
      executables = {};
    };

    // create a new executable from service and register
    executableService.addExecutable = function(executableJson) {
      var ExecutableService = $injector.get(executableJson.id);
      var executable = new ExecutableService();
      angular.extend(executable, executableJson);
      this.registerExecutable(executable.name, executable);
      return executable;
    };

    // register a handler
    executableService.registerExecutable = function(name, executable) {
      executables[name] = executable;
    };

    // get a specific handler
    executableService.getExecutable = function(name) {
      return executables[name];
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
        if ('elementType' in currentElement && currentElement.elementType === 'Executable' && 'processPhase' in executables[currentElement.name]) {
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
