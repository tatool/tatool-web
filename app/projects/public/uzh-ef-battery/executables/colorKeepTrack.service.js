'use strict';

tatool
  .factory('colorKeepTrack', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var ColorKeepTrack = executableUtils.createExecutable();

    var DISPLAY_ENCODING_DURATION_DEFAULT = 6500;
    var INTERVAL_ENCODING_DURATION_DEFAULT = 250;
    var DISPLAY_UPDATING_DURATION_DEFAULT = 1500;
    var INTERVAL_UPDATING_DURATION_DEFAULT = 250;

    var COLORS = [ 'white', 'yellow', 'orange', 'red', 'brown', 'green', 'blue', 'pink', 'purple', 'grey', 'black', 'question' ];
    var SHAPES = [ 'circle', 'triangle', 'square', 'diamond', 'hexagon' ];

    var IMG_EXTENSION = '.png';

    //  Initialze variables at the start of every session
    ColorKeepTrack.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolObjectKeepTrack. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridService = gridServiceFactory.createService(3, 3, 'grid', this.stimuliPath);

      // timing properties
      this.displayEncodingDuration = (this.displayEncodingDuration ) ? this.displayEncodingDuration : DISPLAY_ENCODING_DURATION_DEFAULT;
      this.intervalEncodingDuration = (this.intervalEncodingDuration ) ? this.intervalEncodingDuration : INTERVAL_ENCODING_DURATION_DEFAULT;
      this.displayUpdatingDuration = (this.displayUpdatingDuration ) ? this.displayUpdatingDuration : DISPLAY_UPDATING_DURATION_DEFAULT;
      this.intervalUpdatingDuration = (this.intervalUpdatingDuration ) ? this.intervalUpdatingDuration : INTERVAL_UPDATING_DURATION_DEFAULT;
      this.timerDisplayEncoding = timerUtils.createTimer(this.displayEncodingDuration, true, this);
      this.timerIntervalEncoding = timerUtils.createTimer(this.intervalEncodingDuration, false, this);
      this.timerDisplayUpdating = timerUtils.createTimer(this.displayUpdatingDuration, true, this);
      this.timerIntervalUpdating = timerUtils.createTimer(this.intervalUpdatingDuration, false, this);

      // trial counter property
      this.counter = 0;

      // prepare stimuli
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(function(list) {
            self.stimuliList = list;
            self.totalStimuli = list.length;
            self.preloadImages(deferred, self.stimuliPath);
          }, function(error) {
            deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        deferred.reject('Invalid property settings for Executable tatoolObjectKeepTrack. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // manually preload images
    ColorKeepTrack.prototype.preloadImages = function(deferred, stimuliPath) {
      var images = [];

      for (var s = 0; s < SHAPES.length; s++) {
        for (var c = 0; c < COLORS.length; c++) {
          var imgName = SHAPES[s] + '_' + COLORS[c] + '.png';
          images.push(imgName);
        }
      }

      async.each(images, function(image, callback) {
        var img = new Image();
        var resource = stimuliPath;
        resource.resourceName = image;
        img.src = executableUtils.getResourcePath(resource);
        callback();
      }, function(err) {
        if( err ) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
    };

    // Create stimulus and set properties
    ColorKeepTrack.prototype.createStimulus = function() {

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    // Set encoding stimuli (all at once)
    ColorKeepTrack.prototype.setEncodingStimuli = function() {
      this.updateStep = 0;
      this.recallStep = 0;
      this.totalUpdatingSteps = 0;

      for (var i = 0; i < SHAPES.length; i++) {
        this.gridService.addCellAtPosition((i+1), {
          stimulusValue: SHAPES[i] + '_' + COLORS[this.stimulus['item' + i]] + IMG_EXTENSION, 
          stimulusValueType: 'image'
        });
      }
    };

    // Set updating stimulus (one at a time)
    ColorKeepTrack.prototype.setUpdatingStimuli = function() {
      this.updateStep++;
      this.totalUpdatingSteps = this.stimulus['listlength'];

      this.gridService.addCellAtPosition((this.stimulus['shape'] + 1), {
        stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[this.stimulus['color']] + IMG_EXTENSION, 
        stimulusValueType: 'image'
      });

      if (this.updateStep === this.stimulus['listlength']) {
        this.setPhase('RECALL');
      }
    };

    // Set recal stimuli (all colors for one shape)
    ColorKeepTrack.prototype.setRecallStimuli = function() {
      this.recallStep++;
      this.startTime = 0;
      this.endTime = 0;

      // set cue stimulus
      this.gridService.addCellAtPosition(13, {
        stimulusValue: SHAPES[this.stimulus['shape']] + '_question' + IMG_EXTENSION, 
        stimulusValueType: 'image'
      });

      for (var iLeft = 0; iLeft < 5; iLeft++) {
        this.gridService.addCellAtPosition((iLeft * 5) + 1, {
          stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[(iLeft + 1)] + IMG_EXTENSION, 
          stimulusValueType: 'image',
          gridCellClass: 'colorKeepTrack_fillCell',
          color: COLORS[(iLeft + 1)]
        });
      }

      for (var iRight = 0; iRight < 5; iRight++) {
        this.gridService.addCellAtPosition((iRight * 5) + 5, {
          stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[(iRight + 6)] + IMG_EXTENSION, 
          stimulusValueType: 'image',
          gridCellClass: 'colorKeepTrack_fillCell',
          color: COLORS[(iRight + 6)]
        });
      }

      if (this.recallStep === this.stimulus['listlength']) {
        this.setPhase('ENCODING');
      }
    };

    ColorKeepTrack.prototype.getPhase = function() {
      return this.phase;
    };

    ColorKeepTrack.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response
    ColorKeepTrack.prototype.processResponse = function(givenResponse, timing) {
      this.trial = {};
      this.trial.trialNumber = this.stimulus['trialsno'];
      this.trial.responseNumber = this.stimulus['step'];
      this.trial.nSubstitutions = this.stimulus['nsubst'];
      this.trial.nRepetitions = this.stimulus['nrep'];
      this.trial.nSteps = this.totalUpdatingSteps;
      this.trial.correctResponse = COLORS[this.stimulus['color']];
      this.trial.givenResponse = givenResponse;
      this.trial.stimulusValue = SHAPES[this.stimulus['shape']];
      this.trial.score = (this.trial.correctResponse === this.trial.givenResponse) ? 1 : 0;
      return dbUtils.saveTrial(this.trial);
    };

    ColorKeepTrack.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return ColorKeepTrack;

  }]);
