'use strict';

tatool
  .factory('tatoolInstruction', [ '$log', '$templateCache', 'executableUtils', 'inputServiceFactory',
    function ($log, $templateCache, executableUtils, inputServiceFactory) {

    var TatoolInstruction = executableUtils.createExecutable();

    // preload all instructions and fail if page can't be found
    TatoolInstruction.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.showDigitPagination) {
        this.showDigitPagination = true;
      } else {
        this.showDigitPagination = (this.showDigitPagination.propertyValue === true) ? true : false;
      }

      var self = this;
      if (this.pages && this.pages.propertyValue && this.pages.propertyValue.length > 0) {
        this.refreshCache().then(function() {
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });
      } else if (this.images && this.images.propertyValue && this.images.propertyValue.length > 0) {
        this.imageUrls = [];
        async.each(this.images.propertyValue, function(image, callback) {
          var imgUrl = executableUtils.getResourcePath(image);
          self.imageUrls.push(imgUrl);
          var img = new Image();
          img.src = imgUrl;
          callback();
        }, function(err) {
          if( err ) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolInstruction. Expected property <b>pages</b> or <b>images</b> of type Array (Resource).');
      }

      this.inputService = inputServiceFactory.createService();

      return deferred;
    };

    TatoolInstruction.prototype.refreshCache = function() {
      var deferred = executableUtils.createPromise();
      async.each(this.pages.propertyValue, function(page, callback) {
          if (page.project.access !== 'external') {
            executableUtils.getResource(page).then(function(template) {
                // parse HTML for images and replace with proper resource path
                var parsedTemplate = $('<div/>').append(template);
                parsedTemplate.find('img').prop('src',function() {
                  var res = { project: page.project, resourceType: 'instructions', resourceName: this.getAttribute('src')};
                  return executableUtils.getResourcePath(res);
                });
                $templateCache.put(page.resourceName, parsedTemplate);
                callback();
              }, function(error) {
                callback('Could not find page "' + page.resourceName + '" in instruction "' + self.name + '".');
              });
          } else {
            callback('The Instruction Executable currently doesn\'t support External HTML resources<br><br><li>' + page.resourceName);
          }
        }, function(err) {
          if( err ) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });
      return deferred.promise;
    };

    TatoolInstruction.prototype.stopExecutable = function() {
      executableUtils.stop();
    };

    return TatoolInstruction;
  }]);
