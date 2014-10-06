'use strict';
/* global IDBStore */

angular.module('tatool')
  .factory('dataService', ['$log', '$q', function ($log, $q) {
    $log.debug('DataService: initialized');

    var data = {};

    var usersDBready = false;
    var modulesDBready = false;
    var trialsDBready = false;

    // initialize user db
    data.openUsersDB = function(callback) {
      if (usersDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        data.usersDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: 'tatool_u',
          keyPath: 'userName',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Users store ready!');
            usersDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };

    // initialize modules db
    data.openModulesDB = function(userName, callback) {
      if (modulesDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        var prefix = Sha1.hash(userName);

        data.modulesDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: prefix + '_m',
          keyPath: 'moduleId',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Modules store ready!');
            modulesDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };

    // initialize trials db
    data.openTrialsDB = function(userName, callback) {
      if (trialsDBready) {
        if (callback !== null) {
          callback();
        }
      } else {
        var prefix = Sha1.hash(userName);

        data.trialsDB = new IDBStore({
          dbVersion: 1,
          storePrefix: '',
          storeName: prefix + '_t',
          keyPath: '_id',
          autoIncrement: false,
          onStoreReady: function(){
            $log.debug('Trials store ready!');
            trialsDBready = true;
            if (callback !== null) {
              callback();
            }
          }
        });
      }
    };

    // get a user by its userName
    data.getUser = function(userName) {
      var deferred = $q.defer();

      var userNameHash = Sha1.hash(userName);

      data.usersDB.get(userNameHash,
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('Login failed. There seems to be an issue with the login process.');
        });

      return deferred.promise;
    };

    // add a new user
    data.addUser = function(user) {
      var deferred = $q.defer();

      user.userName = Sha1.hash(user.userName);
      user.userPassword = Sha1.hash(user.userPassword);

      data.usersDB.put(user,
        function(data) {
          deferred.resolve(data);
        }, function() {
          deferred.reject('Login failed. There seems to be an issue with the login process.');
        });

      return deferred.promise;
    };

    // return all modules from DB
    data.getAllModules = function() {
      var deferred = $q.defer();

      function onSuccess(data) {
        deferred.resolve(data);
      }

      function onError(error) {
        deferred.reject(error);
      }

      data.modulesDB.getAll(onSuccess, onError);

      return deferred.promise;
    };

    // get a module from db by its moduleId
    data.getModule = function(moduleId) {
      var deferred = $q.defer();

      data.modulesDB.get(moduleId,
        function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject('Module retrieval failed: ' + error);
        });
      return deferred.promise;
    };

    // upload module file with HTML5 File API
    data.addModule = function(module) {
      var deferred = $q.defer();

      var moduleJson = JSON.parse(JSON.stringify(module));

      data.modulesDB.put(moduleJson,
        function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject('Module creation failed: ' + error);
        });

      return deferred.promise;
    };

    // delete a module and all of its trials
    data.deleteModule = function(userName, moduleId) {
      var deferred = $q.defer();

      data.modulesDB.remove(moduleId,
        function() {
          data.deleteModuleTrials(userName, moduleId).then(
            function(data) {
              deferred.resolve(data);
            }, function() {
              deferred.reject('Error during removal of module trials.');
            });
        }, function() {
          deferred.reject('Error during removal of module.');
        });

      return deferred.promise;
    };
    
    // delete all trials of given module
    data.deleteModuleTrials = function(userName, moduleId) {
      var deferred = $q.defer();

      function deleteTrials() {
        var keyRange = data.trialsDB.makeKeyRange({
          lower: moduleId + '_',
          excludeLower: false,
          upper: moduleId + '__',
          excludeUpper: false
        });

        data.trialsDB.remove(keyRange,
          function(data) {
            deferred.resolve(data);
          }, function(error) {
            deferred.reject(error);
          });
      }

      data.openTrialsDB(userName, deleteTrials);

      return deferred.promise;
    };

    // add a new trial. The internal ID is [moduleId]_[sessionId]_[trialTime]
    data.addTrial = function(trial) {
      var deferred = $q.defer();
      
      data.trialsDB.put(JSON.parse(JSON.stringify(trial)),
        function(data) {
          deferred.resolve(data);
        }, function(error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    // get all trials of current module
    data.getAllTrials = function(userName, moduleId) {
      var deferred = $q.defer();

      function queryTrials() {
        var options = {};
        var moduleKeyRange = data.trialsDB.makeKeyRange({
          lower: moduleId + '_',
          excludeLower: false,
          upper: moduleId + '__',
          excludeUpper: false
        });

        var onError = function(error) {
          deferred.reject(error);
        };

        options = {keyRange: moduleKeyRange, onError: onError};

        data.trialsDB.query(
          function(data) {
            deferred.resolve(data);
          }, options);
      }
     
      data.openTrialsDB(userName, queryTrials);

      return deferred.promise;
    };

    //TODO: reqork with new IDBWrapper

    // get trials of specific sequential sessions
    data.getTrials = function(moduleId, startSession, endSession) {
      var startKey = moduleId + '_' + ('000000'+ startSession ).slice(-6) + '_';
      var endKey = (endSession) ? moduleId + '_' + endSession + '__' : null;
      return data.trialsDB.allDocs({startkey: startKey, endkey: endKey, include_docs: true});
    };

    // get all trial ids of given module
    data.getModuleTrialIds = function(moduleId) {
      var key = moduleId + '_';
      return data.trialsDB.allDocs({startkey: key, endkey: key + '_'});
    };


    return data;

  }]);