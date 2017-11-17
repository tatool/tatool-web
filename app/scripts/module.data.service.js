'use strict';

ModuleDataService.$inject = ['$log', '$q', '$http', 'trialDataService'];

function ModuleDataService($log, $q, $http, trialDataService) {
    $log.debug('ModuleDataService: initialized');

    var data = {};
    
    // initialize modules db
    data.openModulesDB = function(userName, mode, callback) {
      // we don't need to to open a connection in remote mode
      data.api = mode;

      if (callback !== null) {
        callback();
      }
    };

    // return all modules from DB
    data.getAllModules = function() {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/modules')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });
      
      return deferred.promise;
    };

    // return all repository modules from DB
    data.getRepositoryModules = function() {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/repository')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });
      
      return deferred.promise;
    };

    // get a module from db by its moduleId
    data.getModule = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/modules/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get a public module
    data.getPublicModule = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/public/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get a module from the repository by its moduleId
    data.getRepositoryModule = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/repository/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // add new module to db
    data.addModule = function(module) {
      var deferred = $q.defer();
      var moduleJson = JSON.parse(JSON.stringify(module));

      $http.post('/api/' + data.api + '/modules/' + module.moduleId, moduleJson)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    data.installModule = function(moduleId) {
      var deferred = $q.defer();

      $http.post('/api/' + data.api + '/modules/' + moduleId + '/install')
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    data.inviteUser = function(moduleId, user) {
      var deferred = $q.defer();
      $http.post('/api/' + data.api + '/repository/' + moduleId + '/invite', user)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    data.removeInvite = function(moduleId, user) {
      var deferred = $q.defer();
      $http.post('/api/' + data.api + '/repository/' + moduleId + '/invite/remove', user)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    data.replyInvite = function(moduleId, response) {
      var deferred = $q.defer();
      $http.post('/api/' + data.api + '/modules/' + moduleId + '/invite/' + response)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // publish module to repository
    data.publishModule = function(moduleId, moduleType) {
      var deferred = $q.defer();

      $http.post('/api/' + data.api + '/modules/' + moduleId + '/publish/' + moduleType)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // unpublish module from repository
    data.unpublishModule = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/modules/' + moduleId + '/unpublish')
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // delete a module and all of its trials
    data.deleteModule = function(userName, moduleId) {
      var deferred = $q.defer();

      $http.delete('/api/' + data.api + '/modules/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          trialDataService.deleteModuleTrials(userName, moduleId, data.api).then(
            function(data) {
              deferred.resolve(data);
            }, function() {
              deferred.reject('Error during removal of module trials.');
            });
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get all projects a user has access to
    data.getProjects = function() {
      var deferred = $q.defer();

      $http.get('/api/' + data.api + '/projects')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get all projects
    data.getAllProjects = function() {
      var deferred = $q.defer();

      $http.get('/api/admin/projects')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // add project
    data.addProject = function(project) {
      var deferred = $q.defer();

      $http.post('/api/admin/projects/' + project.access + '/' + project.name, project)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // delete a module and all of its trials
    data.deleteProject = function(project) {
      var deferred = $q.defer();

      $http.delete('/api/admin/projects/' + project.access + '/' + project.name)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get all analytics enabled modules
    data.getAllModuleAnalytics = function() {
      var deferred = $q.defer();

      $http.get('/api/analytics/modules')
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get analytics of one module
    data.getModuleAnalytics = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/analytics/modules/' + moduleId)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // delete module analytics
    data.deleteModuleAnalytics = function(moduleId) {
      var deferred = $q.defer();

      $http.delete('/api/analytics/modules/' + moduleId)
        .success(function (data) {
          if (data === 'null') {
            data = null;
          }
          deferred.resolve(data);
        })
        .error(function (error) {
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // delete user analytics data
    data.deleteModuleUserAnalytics = function(user, module) {
      var deferred = $q.defer();

      $http.delete('/api/analytics/modules/' + module.moduleId + '/' + user.code)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get user analytics data
    data.getModuleAnalyticsUserData = function(user, module) {
      var deferred = $q.defer();

      $http.get('/api/analytics/data/modules/' + module.moduleId + '/' + user.code)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    // get all module analytics data
    data.getModuleAnalyticsAllUserData = function(moduleId) {
      var deferred = $q.defer();

      $http.get('/api/analytics/data/modules/' + moduleId)
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (error) {
          $log.error(error);
          deferred.reject(error.message);
        });

      return deferred.promise;
    };

    return data;

}

export default ModuleDataService;