'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', '$http', '$q', 'tatoolExecutable',
    function ($log, $templateCache, $http, $q, tatoolExecutable) {

    var TatoolInstruction = tatoolExecutable.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = $q.defer();

      async.each(this.pages, function(page, callback) {
        $http.get(tatoolExecutable.projectUrl + 'instructions/' + page).
        success(function(template) {
          $templateCache.put(page, template);
          callback();
        }).
        error(function(error) {
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
