'use strict';

angular.module('tatool.auth').factory('authInterceptor', [ '$log', '$rootScope', '$q', '$window', '$injector', 'cfg', 'messageService', 'spinnerService',
  function ($log, $rootScope, $q, $window, $injector, cfg, messageService, spinnerService) {
  return {
    request: function (config) {
      if (cfg.MODE === 'REMOTE') {
        config.headers = config.headers || {};
        var token = $window.sessionStorage.getItem('token');
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
      }
      return config;
    },
    requestError: function(rejection) {
      return $q.reject(rejection);
    },
    response: function (response) {
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      if (rejection.status === 401) {
        $log.error('HTTP Error (' + rejection.status + '): ', rejection.data);
        var authService = $injector.get('authService');
        var $state = $injector.get('$state');
        authService.logout();
        messageService.setMessage({ type: 'danger', msg: 'Your session has expired. Please login again.'});
        spinnerService.stop('loadingSpinner');
        $state.go('login');
        return $q.reject(rejection);
      } else {
        return $q.reject(rejection);
      }
    }
  };
}]);