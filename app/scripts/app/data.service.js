'use strict';

angular.module('tatool.app')
  .factory('dataService', ['$log', '$q', 'userService', function ($log, $q, userService) {
    $log.debug('DataService: initialized');

    var data = {};

    data.initUserDB = function() {
      var prefix = Sha1.hash(userService.getUserName());
      data.modulesDB = new PouchDB(prefix + '_m');
      data.trialsDb = new PouchDB(prefix + '_t');
    };

    if (userService.getUserName()) {
      data.initUserDB();
    }

    // return all modules from DB
    data.getAllModules = function() {
      return data.modulesDB.allDocs({include_docs: true});
    };

    // get a module from db by its moduleId
    data.getModule = function(moduleId) {
      return data.modulesDB.get(moduleId);
    };

    // upload module file with HTML5 File API
    data.addModule = function(file) {
      var deferred = $q.defer();

      // Check for the various File API support.
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        if (!file) {
          deferred.reject('Failed to load file');
        } else {
          var r = new FileReader();
          r.onload = (function () {
            return function (e) {
              var contents = e.target.result;
              data.validateModule(deferred, contents);
            };
          })(file);

          r.readAsText(file);
        }

      } else {
        deferred.reject('The File APIs are not fully supported by your browser. Please update to a current browser.');
      }

      return deferred.promise;
    };

    // validate input module file and save module
    data.validateModule = function(deferred, contents) {
      try {
        var moduleDefinition = JSON.parse(contents);

        // check if moduleDefinition is a proper object
        if (typeof moduleDefinition === 'object') {
          // create module object
          var newModule = new Module(moduleDefinition.id);
          newModule.setModuleName(moduleDefinition.name);
          newModule.setModuleAuthor(moduleDefinition.author);
          newModule.setModuleVersion(moduleDefinition.version);
          newModule.setModulePackageUrl(moduleDefinition.packageUrl);
          newModule.setModuleDefinition(moduleDefinition);

          // store module
          data.getModule(newModule.moduleId).then(
            function() {
              deferred.reject('The module with the id <b>\'' + newModule.moduleId + '\'</b> already exists.');
            }, function() {
              data.modulesDB.put(JSON.parse(JSON.stringify(newModule)), newModule.moduleId);
              deferred.resolve(newModule);
            });
          
        } else {
          deferred.reject('Not a proper JSON file');
        }

      } catch (error) {
        deferred.reject('Syntax Error in module file: ' + error.message);
      }

    };

    // delete a module and all of its trials
    data.deleteModule = function(moduleId) {
      var deferred = $q.defer();

      data.modulesDB.get(moduleId).then(function(doc) {
        data.modulesDB.remove(doc).then(moduleDeleted);
      }).catch(function(){
        deferred.reject('Module doesnt exist.');
      });

      // compact database and trigger deletion of all trials belonging to module
      function moduleDeleted(response) {
        data.modulesDB.compact();
        data.deleteModuleTrials(moduleId).then(function() {
          deferred.resolve(response);
        });
      }

      return deferred.promise;
    };

    // get all trials of current module
    data.getAllTrials = function(moduleId) {
      var key = moduleId + '_';
      return data.trialsDb.allDocs({startkey: key, endkey: key + '_', include_docs: true});
    };

    // get trials of specific sequential sessions
    data.getTrials = function(moduleId, startSession, endSession) {
      var startKey = moduleId + '_' + ('000000'+ startSession ).slice(-6) + '_';
      var endKey = (endSession) ? moduleId + '_' + endSession + '__' : null;
      return data.trialsDb.allDocs({startkey: startKey, endkey: endKey, include_docs: true});
    };

    // get all trial ids of given module
    data.getModuleTrialIds = function(moduleId) {
      var key = moduleId + '_';
      return data.trialsDb.allDocs({startkey: key, endkey: key + '_'});
    };

    // delete all trials of given module
    data.deleteModuleTrials = function(moduleId) {
      var deferred = $q.defer();

      // mark all trials as deleted
      function deleteTrials(result) {
        var trials = [];
        for (var i = 0; i < result.rows.length; i++) {
          var trial = {};
          trial._id = result.rows[i].id;
          trial._rev = result.rows[i].value.rev;
          trial._deleted = true;
          trials.push(trial);
        }
        
        // update db with marked trials and compact
        data.trialsDb.bulkDocs(trials).then(function(response) {
          data.trialsDb.compact();
          deferred.resolve(response);
        });
      }

      // get trials of given module then delete
      this.getModuleTrialIds(moduleId).then(deleteTrials);

      return deferred.promise;
    };

    return data;

  }]);