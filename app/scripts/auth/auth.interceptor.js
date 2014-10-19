'use strict';

angular.module('tatool.auth').factory('authInterceptor', [ '$rootScope', '$q', '$window', 'cfg', function ($rootScope, $q, $window, cfg) {
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
      return $q.reject(rejection);
    }
  };
}]);