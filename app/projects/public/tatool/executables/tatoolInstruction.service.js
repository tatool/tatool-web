'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', '$http', '$q', 'tatoolExecutable', 'tatoolInputService',
    function ($log, $templateCache, $http, $q, tatoolExecutable, tatoolInputService) {

    var TatoolInstruction = tatoolExecutable.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = $q.defer();

      var self = this;
      if (this.pages && this.pages.propertyValue.length > 0) {
        async.each(this.pages.propertyValue, function(page, callback) {
          if (page.project.access !== 'external') {
            tatoolExecutable.getResource(page).then(function(template) {
                $templateCache.put(page.resourceName, template);
                callback();
              }, function(error) {
                callback('Could not find instruction "' + page.resourceName + '" in instruction "' + self.name + '".');
              });
          } else {
            callback('External HTML resources are currently not supported by this executable.<br><br><li>' + page.resourceName);
          }
        }, function(err) {
          if( err ) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });
      } else {
        deferred.resolve();
      }

      this.input = tatoolInputService.createInput();

      return deferred;
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      tatoolExecutable.stop();
    };

    return TatoolInstruction;
  }]);
