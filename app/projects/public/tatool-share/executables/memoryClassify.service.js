'use strict';

tatool
  .factory('memoryClassify', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var memoryClassify = executableUtils.createExecutable();

    var DISPLAY_ENCODING_DURATION_DEFAULT = 3000;
    var INTERVAL_ENCODING_DURATION_DEFAULT = 100;
    //var DISPLAY_UPDATING_DURATION_DEFAULT = 1500;
    //var INTERVAL_UPDATING_DURATION_DEFAULT = 250;

    //var COLORS = [ 'white', 'yellow', 'orange', 'red', 'brown', 'green', 'blue', 'pink', 'purple', 'grey', 'black', 'question' ];
    //var SHAPES = [ 'circle', 'triangle', 'square', 'diamond', 'hexagon' ];

    //var ANIMALS1 = ['ant', 'mosquito', 'worm'];
    //var ANIMALS2 = ['wolf','fish','bird'];
    //var ANIMALS3 = ['elephant','whale','giraffe'];
    var ANIMALS = ['a_ant', 'a_mosquito', 'a_worm','a_wolf','a_fish','a_bird','a_elephant','a_whale','a_giraffe'];
    var BUTTON = ['gray_button'];
    var N_ANIMALS = 3;

    var IMG_EXTENSION = '.png';

    //  Initialze variables at the start of every session
    memoryClassify.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolObjectMemoryClassify. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridService = gridServiceFactory.createService(3, 3, 'grid', this.stimuliPath);

      // timing properties
      this.displayEncodingDuration = (this.displayEncodingDuration ) ? this.displayEncodingDuration : DISPLAY_ENCODING_DURATION_DEFAULT;
      this.intervalEncodingDuration = (this.intervalEncodingDuration ) ? this.intervalEncodingDuration : INTERVAL_ENCODING_DURATION_DEFAULT;
      //this.displayUpdatingDuration = (this.displayUpdatingDuration ) ? this.displayUpdatingDuration : DISPLAY_UPDATING_DURATION_DEFAULT;
      //this.intervalUpdatingDuration = (this.intervalUpdatingDuration ) ? this.intervalUpdatingDuration : INTERVAL_UPDATING_DURATION_DEFAULT;
      this.timerDisplayEncoding = timerUtils.createTimer(this.displayEncodingDuration, true, this);
      this.timerIntervalEncoding = timerUtils.createTimer(this.intervalEncodingDuration, false, this);
      //this.timerDisplayUpdating = timerUtils.createTimer(this.displayUpdatingDuration, true, this);
      //this.timerIntervalUpdating = timerUtils.createTimer(this.intervalUpdatingDuration, false, this);

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
        deferred.reject('Invalid property settings for Executable tatoolObjectMemoryClassify. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return deferred;
    };

    // manually preload images
    memoryClassify.prototype.preloadImages = function(deferred, stimuliPath) {
      var images = [];

      for (var s = 0; s < ANIMALS.length; s++) {
        var imgName = ANIMALS[s] + IMG_EXTENSION;
        images.push(imgName);
      }
      images.push(BUTTON[0]+IMG_EXTENSION);

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
    memoryClassify.prototype.createStimulus = function() {

      // reset counter to 0 if > no. of stimuli
      if (this.counter >= this.totalStimuli) {
        this.counter = 0;
      }

      this.stimulus = executableUtils.getNext(this.stimuliList, this.counter);

      this.counter++;
    };

    // Set encoding stimuli (all at once)
    memoryClassify.prototype.setEncodingStimuli = function() {
      //this.updateStep = 0;
      this.recallStep = 0;
      //this.totalUpdatingSteps = 0;
      for (var i = 0; i<3; i++) {
        this.gridService.addCellAtPosition((i+1), {
          stimulusValue: ANIMALS[this.stimulus['item'+i]] + IMG_EXTENSION,
          stimulusValueType: 'image'
        });
      }
    };

    // Set updating stimulus (one at a time)
    //memoryClassify.prototype.setUpdatingStimuli = function() {
    //  this.updateStep++;
    //  this.totalUpdatingSteps = this.stimulus['listlength'];

    //  this.gridService.addCellAtPosition((this.stimulus['shape'] + 1), {
    //    stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[this.stimulus['color']] + IMG_EXTENSION,
    //   stimulusValueType: 'image'
    //  });

    //  if (this.updateStep === this.stimulus['listlength']) {
    //    this.setPhase('RECALL');
    //  }
    //};

    // Set recal stimuli (all colors for one shape)
    memoryClassify.prototype.setRecallStimuli = function() {
      this.recallStep++;
      this.startTime = 0;
      this.endTime = 0;

      this.gridService.addCellAtPosition(1, {
        stimulusValue: BUTTON[0] + IMG_EXTENSION,
        stimulusValueType: 'image',
        gridCellClass: 'memoryClassify_fillCell',
        order: 1
      });

      this.gridService.addCellAtPosition(2, {
        stimulusValue: BUTTON[0] + IMG_EXTENSION,
        stimulusValueType: 'image',
        gridCellClass: 'memoryClassify_fillCell',
        order: 2
      });

      this.gridService.addCellAtPosition(3, {
        stimulusValue: BUTTON[0] + IMG_EXTENSION,
        stimulusValueType: 'image',
        gridCellClass: 'memoryClassify_fillCell',
        order: 3
      });

      // set cue stimulus
      //this.gridService.addCellAtPosition(13, {
      //  stimulusValue: SHAPES[this.stimulus['shape']] + '_question' + IMG_EXTENSION,
      //  stimulusValueType: 'image'
      //});

      //for (var iLeft = 0; iLeft < 5; iLeft++) {
      //  this.gridService.addCellAtPosition((iLeft * 5) + 1, {
      //    stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[(iLeft + 1)] + IMG_EXTENSION,
      //    stimulusValueType: 'image',
      //    gridCellClass: 'memoryClassify_fillCell',
      //    color: COLORS[(iLeft + 1)]
      //  });
      //}

      //for (var iRight = 0; iRight < 5; iRight++) {
      //  this.gridService.addCellAtPosition((iRight * 5) + 5, {
      //    stimulusValue: SHAPES[this.stimulus['shape']] + '_' + COLORS[(iRight + 6)] + IMG_EXTENSION,
      //    stimulusValueType: 'image',
      //    gridCellClass: 'memoryClassify_fillCell',
      //    color: COLORS[(iRight + 6)]
      //  });
      //}

      if (this.recallStep === this.stimulus['listlength']) {
        this.setPhase('ENCODING');
      }
    };

    memoryClassify.prototype.getPhase = function() {
      return this.phase;
    };

    memoryClassify.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Process given response
    memoryClassify.prototype.processResponse = function(givenResponse, timing) {
      this.trial = {};
      this.trial.trialNumber = this.stimulus['trialsno'];
      this.trial.responseNumber = this.stimulus['step'];
      //this.trial.nSubstitutions = this.stimulus['nsubst'];
      //this.trial.nRepetitions = this.stimulus['nrep'];
      //this.trial.nSteps = this.totalUpdatingSteps;
      this.trial.correctResponse = this.stimulus['correctResponse'];
      this.trial.givenResponse = givenResponse;
      //this.trial.stimulusValue = SHAPES[this.stimulus['shape']];
      this.trial.score = (this.trial.correctResponse === this.trial.givenResponse) ? 1 : 0;
      this.trial.responseTime = this.endTime - this.startTime;
      return dbUtils.saveTrial(this.trial);
    };

    memoryClassify.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return memoryClassify;

  }]);
