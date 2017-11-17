'use strict';

ErrorHandlerService.$inject = ['$log'];

function ErrorHandlerService($log) {
    $log.debug('ErrorHandlerService: initialized');

    var errorHandler = {};
    errorHandler.isError = false;

    errorHandler.setErrorMessage = function(origin, msg) {
      errorHandler.isError = true;
      errorHandler.origin = origin;
      errorHandler.msg = msg;
    };

    errorHandler.getErrorMessage = function() {
      return errorHandler.msg;
    };

    errorHandler.hasError = function() {
      return errorHandler.isError;
    };

    errorHandler.resetError = function() {
      errorHandler.isError = false;
    };

    return errorHandler;

}

export default ErrorHandlerService;