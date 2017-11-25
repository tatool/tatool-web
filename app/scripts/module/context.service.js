'use strict';

ContextService.$inject = ['$log'];

function ContextService($log) {
    $log.debug('context: initialized');

    // following keys are available:
    // currentExecutable: holds the executable which is currently being executed
    // elementStack: holds the current elementStack

    var context = {};
    
    var contextService = {};

    contextService.getProperty = function(propertyName) {
      return context[propertyName];
    };

    contextService.setProperty = function(propertyName, value) {
      context[propertyName] = value;
    };

    contextService.resetProperties = function() {
      for (var prop in context) {
        delete context[prop];
      }
    };

    return contextService;
}

export default ContextService;