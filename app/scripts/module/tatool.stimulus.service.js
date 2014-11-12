'use strict';

angular.module('tatool.module')
  .factory('tatoolStimulusService', [ '$log', 'tatoolExecutable', function ($log, tatoolExecutable) {

    var tatoolStimulusService = {};

    tatoolStimulusService.createStimulus = function(stimulusId) {
      var stimulus = new Stimulus(stimulusId);
      return stimulus;
    };

    function Stimulus(stimulusId) {
      this.stimulusId = stimulusId ? stimulusId : 'default';
      this.dataPath = '';
      this.data = {};

      this.init = function() {
        if (this.data.stimulusValueColor !== undefined) {
          if (this.data.stimulusValueType === 'text') {
            this.stimulusStyle = {
              'color': this.data.stimulusValueColor
            };
          } else {
            this.stimulusStyle = {
              'background-color': this.data.stimulusValueColor
            };
          }
        }

        // prepare image source
        if (this.data.stimulusValueType === 'image') {
          if (tatoolExecutable.isProjectResource(this.dataPath + this.data.stimulusValue)) {
            var imgSrc = tatoolExecutable.getResourcePath('stimuli', this.data.stimulusValue);
            this.stimulusImage = imgSrc;
          } else {
            this.stimulusImage = this.dataPath + this.data.stimulusValue;
          }
        }
        
        if (this.data.stimulusClass !== undefined) {
          this.stimulusClass = this.data.stimulusClass;
        }
      };

      this.set = function(content) {
        this.data = content;
        this.init();
        return this;
      };

      this.setText = function(content) {
        this.data = content;
        this.data.stimulusValueType = 'text';
        this.init();
        return this;
      };

      this.setImage = function(content) {
        this.data = content;
        this.data.stimulusValueType = 'image';
        this.init();
        return this;
      };

      this.get = function() {
        return this.data;
      };
    }

    return tatoolStimulusService;

  }]);