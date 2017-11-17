'use strict';

HandlerService.$inject = ['$log', '$rootScope', '$injector', 'contextService', 'tatoolPhase'];

function HandlerService($log, $rootScope, $injector, contextService, tatoolPhase) {

    var handlerService = {};

    var handlers = {};

    // reset the list of handlers
    handlerService.init = function() {
      handlers = {};
    };

    // create a new handler from service and register
    handlerService.addHandler = function(handlerJson) {
      var HandlerService = $injector.get(handlerJson.customType);
      var handler = new HandlerService();
      angular.extend(handler, handlerJson);
      this.registerHandler(handler.name, handler);
      return handler;
    };

    // register a handler
    handlerService.registerHandler = function(name, handler) {
      handlers[name] = handler;
    };

    // get a specific handler
    handlerService.getHandler = function(name) {
      return handlers[name];
    };

    // informs all handlers of a phase change
    handlerService.informAllHandlers = function(phase) {
      for (var key in handlers) {
        if ('processPhase' in handlers[key]) {
          handlers[key].processPhase(phase);
        }
      }
    };

    // informs all handlers in current elementStack of a phase change
    handlerService.informHandlersInStack = function(phase, elements) {
      for (var i = 0; i < elements.length; i++) {
        var currentElement = elements[i];
        if ('handlers' in currentElement) {
          for (var j = 0; j < currentElement.handlers.length; j++) {
            if ('processPhase' in currentElement.handlers[j]) {
              currentElement.handlers[j].processPhase(phase);
            }
          }
        }
      }
    };

    // checks all dual elements in current elementStack for completion
    handlerService.allDualsCompleted = function(handler) {
      var elementStack = contextService.getProperty('elementStack');
      var isReady = true;

      for (var i = 0; i < elementStack.length; i++) {
        var currentElement = elementStack[i];

        // check the current elements Dual iterator
        if ('iterator' in currentElement) {
          if (currentElement.tatoolType === 'Dual') {
            isReady = !currentElement.iterator.iter.hasNext();
          }
        }

        // stop check as soon as we arrive at the hierarchy of the handler
        if ('handlers' in currentElement) {
          for (var j = 0; j < currentElement.handlers.length; j++) {
            if (handler === currentElement.handlers[j]) {
              return isReady;
            }
          }
        }

      }
      return isReady;
    };

    // checks if handler is part of current elementStack
    handlerService.isInStack = function(handler) {
      var elementStack = contextService.getProperty('elementStack');
      var isAvailable = false;

      for (var i = 0; i < elementStack.length; i++) {
        var currentElement = elementStack[i];

        // stop check as soon as we arrive at the hierarchy of the handler
        if ('handlers' in currentElement) {
          for (var j = 0; j < currentElement.handlers.length; j++) {
            if (handler === currentElement.handlers[j]) {
              return true;
            }
          }
        }

      }
      return isAvailable;
    };

    // listen to broadcast events on $rootScope and inform handlers
    $rootScope.$on(tatoolPhase.SESSION_START, function(arg) {
      handlerService.informAllHandlers(arg.name);
    });
    $rootScope.$on(tatoolPhase.EXECUTABLE_START, function(arg, stack) {
      handlerService.informHandlersInStack(arg.name, stack.displayAll());
    });
    $rootScope.$on(tatoolPhase.EXECUTABLE_END, function(arg, stack) {
      handlerService.informHandlersInStack(arg.name, stack.displayAll());
    });
    $rootScope.$on(tatoolPhase.SESSION_END, function(arg) {
      handlerService.informAllHandlers(arg.name);
    });

    return handlerService;
}

export default HandlerService;
