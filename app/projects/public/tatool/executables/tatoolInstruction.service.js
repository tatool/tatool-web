'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', '$http', '$q', 'tatoolExecutable', 'tatoolInputService',
    function ($log, $templateCache, $http, $q, tatoolExecutable, tatoolInputService) {

    var TatoolInstruction = tatoolExecutable.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = $q.defer();

      this.dataPath = (this.dataPath) ? this.dataPath : '';

      var self = this;
      async.each(this.pages, function(page, callback) {
        if (tatoolExecutable.isProjectResource(self.dataPath + page)) {
          tatoolExecutable.getProjectResource('instructions', page).then(function(template) {
            $templateCache.put(page, template);
            callback();
          }, function(error) {
            callback('Could not find instruction "' + page + '"');
          });
        } else {
          callback('External HTML resources are not supported by this executable.<br><br><li>' + page);
        }
      }, function(err) {
        if( err ) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      this.input = tatoolInputService.createInput();

      return deferred;
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      tatoolExecutable.stop();
    };

    return TatoolInstruction;
  }]);
