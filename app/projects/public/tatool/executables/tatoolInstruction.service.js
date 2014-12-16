'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', '$http', '$q', 'executableUtils', 'inputServiceFactory',
    function ($log, $templateCache, $http, $q, executableUtils, inputServiceFactory) {

    var TatoolInstruction = executableUtils.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = $q.defer();

      var self = this;
      if (this.pages && this.pages.propertyValue && this.pages.propertyValue.length > 0) {
        async.each(this.pages.propertyValue, function(page, callback) {
          if (page.project.access !== 'external') {
            executableUtils.getResource(page).then(function(template) {
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
        deferred.reject('Invalid property settings for Executable tatoolInstruction. Expected property <b>pages</b> of type Array (Resource).');
      }

      this.input = inputServiceFactory.createService();

      return deferred;
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      executableUtils.stop();
    };

    return TatoolInstruction;
  }]);
