'use strict';

StimulusServiceFactory.$inject = ['$log', '$sce', 'executableUtils'];

function StimulusServiceFactory($log, $sce, executableUtils) {

    var stimulusServiceFactory = {};

    stimulusServiceFactory.createService = function(stimuliPath, defaultVisible = false) {
      var stimulus = new Stimulus();
      stimulus.stimuliPath = stimuliPath ? stimuliPath : '';
      stimulus.displayVisible = defaultVisible;
      return stimulus;
    };

    function Stimulus() {
      this.data = {}; 

      this.init = function() {
        if (this.data.stimulusValueColor !== undefined) {
          if (this.data.stimulusValueType === 'text' || this.data.stimulusValueType === 'audio-text') {
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
          var imgResource = this.stimuliPath;
          imgResource.resourceName = this.data.stimulusValue;
          var imgSrc = executableUtils.getResourcePath(imgResource);
          this.stimulusImage = imgSrc;
        }

        // prepare video source
        if (this.data.stimulusValueType === 'video') {
          var videoResource = this.stimuliPath;
          videoResource.resourceName = this.data.stimulusValue;
          var videoSrc = executableUtils.getResourcePath(videoResource);
          this.stimulusVideo = videoSrc;
        }
        
        if (this.data.stimulusClass !== undefined) {
          this.stimulusClass = this.data.stimulusClass;
        }

        // prepare audio source
        if (this.data.stimulusValueType === 'audio') 
        {
          var audioResource = this.stimuliPath;
          audioResource.resourceName = this.data.stimulusValue;
          var audioSrc = executableUtils.getResourcePath(audioResource);
          this.stimulusAudio = audioSrc;
        }

        if (this.data.stimulusValueType === 'audio-image') 
        {
          var imgResource = this.stimuliPath;
          imgResource.resourceName = this.data.stimulusValue;
          var imgSrc = executableUtils.getResourcePath(imgResource);
          this.stimulusImage = imgSrc;

          var audioResource = this.stimuliPath;
          audioResource.resourceName = this.data.stimulusAudioValue;
          var audioSrc = executableUtils.getResourcePath(audioResource);
          this.stimulusAudio = audioSrc;
        }

        if (this.data.stimulusValueType === 'audio-text') 
        {
          var audioResource = this.stimuliPath;
          audioResource.resourceName = this.data.stimulusAudioValue;
          var audioSrc = executableUtils.getResourcePath(audioResource);
          this.stimulusAudio = audioSrc;
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

}

export default StimulusServiceFactory;