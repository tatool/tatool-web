'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', '$http', '$q', 'tatoolExecutable',
    function ($log, $templateCache, $http, $q, tatoolExecutable) {

    var TatoolInstruction = tatoolExecutable.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = $q.defer();

      async.each(this.pages, function(page, callback) {
        tatoolExecutable.getProjectResource('instructions', page).then(function(template) {
          $templateCache.put(page, template);
          callback();
        }, function(error) {
          callback('Could not find instruction "' + tatoolExecutable.projectUrl + 'instructions/' + page + '"');
        });
      }, function(err) {
        if( err ) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      return deferred;
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      tatoolExecutable.stopExecutable();
    };

    return TatoolInstruction;
  }]);
