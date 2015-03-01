'use strict';

angular.module('tatool.module')
  .factory('stimulusServiceFactory', [ '$log', '$sce', 'executableUtils', function ($log, $sce, executableUtils) {

    var stimulusServiceFactory = {};

    stimulusServiceFactory.createService = function(stimuliPath) {
      var stimulus = new Stimulus();
      stimulus.stimuliPath = stimuliPath ? stimuliPath : '';
      return stimulus;
    };

    function Stimulus() {
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
          var resource = this.stimuliPath;
          resource.resourceName = this.data.stimulusValue;
          var imgSrc = executableUtils.getResourcePath(resource);
          this.stimulusImage = imgSrc;
        }

        // prepare video source
        if (this.data.stimulusValueType === 'video') {
          var resource = this.stimuliPath;
          resource.resourceName = this.data.stimulusValue;
          var videoSrc = executableUtils.getResourcePath(resource);
          this.stimulusVideo = videoSrc;
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

    return stimulusServiceFactory;

  }]);