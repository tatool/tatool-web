'use strict';

AuthInterceptor.$inject = ['$log', '$rootScope', '$q', '$window', '$injector', 'cfg', 'messageService', 'spinnerService'];

function AuthInterceptor($log, $rootScope, $q, $window, $injector, cfg, messageService, spinnerService) {
  return {
    request: function (config) {
      if (!config.skipauth) {
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
      var $state = $injector.get('$state');
      if (rejection.status === 401) {
        var authService = $injector.get('authService');
        authService.logout();
        messageService.setMessage({ type: 'danger', msg: 'Your session has expired. Please login again.'});
        spinnerService.stop('loadingSpinner');
        $state.go('login');
        return $q.reject(rejection);
      } else if (rejection.status === 403) {
        spinnerService.stop('loadingSpinner');
        $state.go('home');
      } else {
        return $q.reject(rejection);
      }
    }
  };
}

export default AuthInterceptor;