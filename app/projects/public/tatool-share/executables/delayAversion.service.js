'use strict';

tatool
  .factory('delayAversion', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var DelayAversion = executableUtils.createExecutable();

    var FAST_COUNT = 5;
    var SLOW_COUNT = 15;
    var COUNT_TIME = 1000;
    var SCORE_DELAY = 1000;
    var TURNS = 15;

    var BUTTONS = ['button_1', 'button_2'];

    var IMG_EXTENSION = '.png';

    //  Initialize variables at the beginning of every session
    DelayAversion.prototype.init = function() {
      var deferred = executableUtils.createPromise();

      if (!this.stimuliPath) {
        deferred.reject('Invalid property settings for Executable tatoolObjectDelayAversion. Expected property <b>stimuliPath</b> of type Path.');
      }

      // template properties
      this.gridService = gridServiceFactory.createService(3, 3, 'grid', this.stimuliPath);

      // Countdown variables
      this.fastCountdown = this.min || FAST_COUNT;
      this.slowCountdown = this.max || SLOW_COUNT;

      // elections remaining
      this.turns = this.turns || TURNS;

      // timing properties
      this.countdownInterval = (this.countdownInterval) ? this.countdownInterval : COUNT_TIME;
      this.scoreInterval = (this.scoreInterval) ? this.scoreInterval: SCORE_DELAY;

      this.timerCountdown = timerUtils.createTimer(this.countdownInterval, false, this);
      this.timerScore = timerUtils.createTimer(this.scoreInterval, false, this);

      // total punctuation
      this.totalScore = 0;

      this.preloadImages(deferred, this.stimuliPath);

      return deferred;
    };


    // manually preload images
    DelayAversion.prototype.preloadImages = function(deferred, stimuliPath) {
      var images = [];

      for (var s = 0; s < BUTTONS.length; s++) {
        var imgName = BUTTONS[s] + '.png';
        images.push(imgName);
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

    DelayAversion.prototype.showCountdown = function() {

      if (this.fastCountdown < 1) {
        this.gridService.addCellAtPosition(4, {
          stimulusValue: BUTTONS[0] + IMG_EXTENSION,
          stimulusValueType: 'image',
          gridCellClass: 'delayAversion_fillCell',
          type: BUTTONS[0]
        });
      } else {
        this.gridService.addCellAtPosition(4, {
          stimulusValue: this.fastCountdown,
          stimulusValueType: 'text',
          gridCellClass: 'delayAversion_countCell'
        });
      }

      if (this.slowCountdown < 1) {
        this.gridService.addCellAtPosition(6, {
          stimulusValue: BUTTONS[1] + IMG_EXTENSION,
          stimulusValueType: 'image',
          gridCellClass: 'delayAversion_fillCell',
          type: BUTTONS[1]
        });
      } else {
        this.gridService.addCellAtPosition(6, {
          stimulusValue: this.slowCountdown,
          stimulusValueType: 'text',
          gridCellClass: 'delayAversion_countCell'
        });
      }

      if (this.fastCountdown < 1) {
        this.gridService.addCellAtPosition(2, {
          stimulusValue: 'Elecciones restantes: ' + this.turns,
          stimulusValueType: 'text',
          gridCellClass: 'delayAversion_fillCell'
        });
      } else {
        this.gridService.addCellAtPosition(1, {
          stimulusValue: 'Elecciones restantes: ' + this.turns,
          stimulusValueType: 'text',
          gridCellClass: 'delayAversion_fillCell'
        });
      }

      if (this.fastCountdown < 1) {
        this.gridService.addCellAtPosition(8, {
        stimulusValue: 'Puntos: ' + this.totalScore,
        stimulusValueType: 'text',
        gridCellClass: 'delayAversion_fillCell'
      });
      } else {
        this.gridService.addCellAtPosition(7, {
        stimulusValue: 'Puntos: ' + this.totalScore,
        stimulusValueType: 'text',
        gridCellClass: 'delayAversion_fillCell'
      });
      }
    }

    DelayAversion.prototype.resetCountdown = function() {
      this.fastCountdown = this.min || FAST_COUNT;
      this.slowCountdown = this.max || SLOW_COUNT;
    };

    // Process given response
    DelayAversion.prototype.processResponse = function(givenResponse, timing) {
      this.trial = {};
      this.trial.trialNumber = TURNS - this.turns + 1;
      this.trial.givenResponse = givenResponse;
      this.trial.score = (this.trial.givenResponse === BUTTONS[1]) ? 3 : 1;
      this.totalScore += this.trial.score;
      return dbUtils.saveTrial(this.trial);
    };

    DelayAversion.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return DelayAversion;

  }]);
