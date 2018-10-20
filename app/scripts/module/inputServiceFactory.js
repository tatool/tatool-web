'use strict';

/* global KeyCodes */

import KeyCodes from './util/keycodes.js';

InputServiceFactory.$inject = ['executableUtils'];

function InputServiceFactory(executableUtils) {

    var inputServiceFactory = {};

    inputServiceFactory.createService = function(stimuliPath, defaultVisible = false) {
      var input = new Input();
      input.stimuliPath = stimuliPath ? stimuliPath : '';
      input.displayVisible = defaultVisible;
      return input;
    };

    function Input() {
      this.registeredKeyInputs = {};
      this.keyInputOrder = [];

      // adds new key
      this.addInputKey = function(keyCode, givenResponse, label, labelType, hide) {
        var obj = {};
        obj.givenResponse = givenResponse;
        obj.keyCode = keyCode;
        if (label) {
          obj.label = label;
        }
        if (labelType) {
          obj.labelType = labelType;
        }
        if (hide) {
          obj.hide = hide;
        }
        obj.dynamic = true;

        // add unknown keyCode
        if (!KeyCodes[keyCode]) {
          KeyCodes[keyCode] = executableUtils.getTiming();
        }

        this.registeredKeyInputs[KeyCodes[keyCode]] = obj;

        if (this.keyInputOrder.indexOf(KeyCodes[keyCode]) === -1) {
          this.keyInputOrder.push(KeyCodes[keyCode]);
        }

        // trigger a refresh in our directive
        this.refreshKeys();

        return this;
      };

      // Refresh for keys added before directive is loaded. Will be overridden by directive method as soon as its loaded
      this.refreshKeys = function() {

      };

      // Add list of keys in correct order
      this.addInputKeys = function(list, hide) {
        var keys = [];
        var keyCodes = {};
        var keyCounter = 0;

        // extract key information from stimuli list
        for (var i = 0; i < list.length; i++) {
          if (list[i].keyCode !== undefined && !(list[i].keyCode in keyCodes)) {
            keyCodes[list[i].keyCode] = { keyCode: list[i].keyCode, keyLabel: list[i].keyLabel, keyLabelType: list[i].keyLabelType, keyIndex: list[i].keyIndex, response: list[i].response };
          }
        }

        // order keys according to keyIndex if provided
        angular.forEach(keyCodes, function(key) {
          if (key.keyIndex) {
            keys[key.keyIndex] = key;
          } else {
            keys[keyCounter] = key;
            keyCounter++;
          }
        });

        // add keys to inputService
        for (var j=0; j < keys.length; j++) {
          if (keys[j]) {
            this.addInputKey(keys[j].keyCode, keys[j].response, keys[j].keyLabel, keys[j].keyLabelType, hide);
          }
        }

        return keys;
      };

      // private method used by the tatoolInput directive to register static keys in the template
      this._registerStaticKey = function(keyCode, givenResponse) {
        var obj = {};
        obj.givenResponse = givenResponse;
        obj.keyCode = keyCode;
        obj.dynamic = false;
        this.registeredKeyInputs[KeyCodes[keyCode]] = obj;
        this.keyInputOrder.push(KeyCodes[keyCode]);
        return this;
      };

      // private method used by the tatoolInput directive to register static text keys in the template
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

    return inputServiceFactory;

}

export default InputServiceFactory;