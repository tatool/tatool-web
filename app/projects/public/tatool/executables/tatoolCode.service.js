'use strict';

tatool
  .factory('tatoolCode', [ 'executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory',
    function (executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory) {

    var Code = executableUtils.createExecutable();

    var DEFAULT_INPUT_TEXT = 'Please enter your Code below:';

    Code.prototype.init = function() {
      this.inputService = inputServiceFactory.createService(this.stimuliPath);
      this.inputText = this.inputText || DEFAULT_INPUT_TEXT;

      this.minCodeLength = parseInt(this.minCodeLength);
      this.exactCodeLength = parseInt(this.exactCodeLength);
    };

    Code.prototype.processResponse = function(code) {
      var codeValid = true;

      if (this.exactCodeLength > 0) {
        codeValid = (code.length === this.exactCodeLength) ? true : false;
      } else if (this.minCodeLength > 0) {
        codeValid = (code.length >= this.minCodeLength) ? true : false;
      } 

      // store code as session property 'sessionCode'
      if (codeValid) {
        dbUtils.setSessionProperty(this, 'sessionCode', code);
      }

      return codeValid;
    };

    Code.prototype.stopExecution = function() {
      executableUtils.stop();
    }

    return Code;

  }]);
