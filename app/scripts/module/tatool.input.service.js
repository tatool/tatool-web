'use strict';

/* global KeyCodes */

angular.module('tatool.module')
  .factory('tatoolInputService', [ 'tatoolExecutable', function (tatoolExecutable) {

    var tatoolInputService = {};

    tatoolInputService.createInput = function() {
      var input = new Input();
      return input;
    };

    function Input() {
      this.registeredKeyInputs = {};
      this.keyInputOrder = [];

      // adds new key
      this.addInputKey = function(keyCode, givenResponse, label, hide) {
        var obj = {};
        obj.givenResponse = givenResponse;
        obj.keyCode = keyCode;
        if (label) {
          obj.label = label;
        }
        if (hide) {
          obj.hide = hide;
        }
        obj.dynamic = true;

        // add unknown keyCode
        if (!KeyCodes[keyCode]) {
          KeyCodes[keyCode] = tatoolExecutable.getTiming();
        }

        this.registeredKeyInputs[KeyCodes[keyCode]] = obj;

        if (this.keyInputOrder.indexOf(KeyCodes[keyCode]) === -1) {
          this.keyInputOrder.push(KeyCodes[keyCode]);
        }
        return this;
      };

      // private method used by the tatoolInput directive to register manually added keys in the template
      this._registerStaticKey = function(keyCode, givenResponse) {
        var obj = {};
        obj.givenResponse = givenResponse;
        obj.keyCode = keyCode;
        obj.dynamic = false;
        this.registeredKeyInputs[KeyCodes[keyCode]] = obj;
        this.keyInputOrder.push(KeyCodes[keyCode]);
        return this;
      };

      // private method used by the tatoolInput directive to register manually added text keys in the template
      this._registerStaticTextKey = function(keyCode, givenResponse, textInputId) {
        var obj = {};
        obj.givenResponse = '';
        obj.keyCode = keyCode;
        obj.textInput = textInputId;
        obj.dynamic = false;
        this.registeredKeyInputs[KeyCodes[keyCode]] = obj;
        this.keyInputOrder.push(KeyCodes[keyCode]);
        return this;
      };

      // private method used by the tatoolInput directive to unregister a dynamically added key
      this._removeDynamicKey = function(keyCode) {
        delete this.registeredKeyInputs[KeyCodes[keyCode]];

        var index = this.keyInputOrder.indexOf(KeyCodes[keyCode]);
        if (index > -1) {
          this.keyInputOrder.splice(index, 1);
        }
        return this;
      };

      // private method used by the tatoolInput directive to unregister all keys
      this._removeAllKeys = function() {
        this.registeredKeyInputs = {};
        this.keyInputOrder = [];
      };

    }

    return tatoolInputService;

  }]);