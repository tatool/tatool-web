'use strict';

TimerUtilsService.$inject = ['$log', '$timeout', '$interval', 'statusPanelService', 'executableUtils'];

function TimerUtilsService($log, $timeout, $interval, statusPanelService, executableUtils) {

    var timerUtils = {};

    var timers = {};

    var VISUAL_TIMER_INTERVAL = 25;

    // creates a new timer, registers and returns it
    timerUtils.createTimer = function(duration, visual, executable) {
      if (!executable.name) {
        throw('Timer could not be created for executable  with customType \''+executable.customType+ '\'. The name property for this executable is missing.');
      }

      var newTimer = new Timer(duration, visual);
      if (!timers[executable.name]) {
        timers[executable.name] = [];
      }
      timers[executable.name].push(newTimer);
      return newTimer;
    };

    // stops all timers
    timerUtils.cancelAllTimers = function() {
      for (var key in timers) {
        for (var i = 0; i < timers[key].length; i++) {
          timers[key][i].stop();
        }
      }
    };

    // stops all timers and deletes them
    timerUtils.clearAllTimers = function() {
      this.cancelAllTimers();
      timers = [];
    };

    // stops all timers of a given executable
    timerUtils.cancelExecutableTimers = function(executableId) {
      if (executableId in timers) {
        for (var i = 0; i < timers[executableId].length; i++) {
          timers[executableId][i].stop();
        }
      }
    };

    // constructor for new timer
    var Timer = function(duration, visual) {
      this.duration = duration;
      this.visual = visual;

      this.timerStatus = {};
      this.timerStatus.progress = 0;
      this.actualTimer = null;
      this.visualTimer = null;
      this.progressUpdate = 1/((this.duration-VISUAL_TIMER_INTERVAL)/VISUAL_TIMER_INTERVAL);
      this.digitUpdate = Math.round((100/(this.duration/VISUAL_TIMER_INTERVAL)));
    };

    // start the timer and run the function passed as an argument
    Timer.prototype.start = function(targetFunction) {
      // reset values
      this.timerStatus.progress = 0;

      // set the target function to run when timer is up
      this.targetFunction = targetFunction;

      // start actual timer
      this.actualTimer = $timeout(this.timerUp.bind(this), this.duration);

      // start visual timer if required
      if (this.visual) {
        //this.visualTimer = $interval(updateVisualTimer.bind(this), VISUAL_TIMER_INTERVAL, this.duration/VISUAL_TIMER_INTERVAL);
        this.visualTimer = window.requestAnimationFrame(updateVisualTimer.bind(this));
      }
      return executableUtils.getTiming();
    };
    /*jshint -W040 */
    function updateVisualTimer(time) {
      if (!this.startTime) {
        this.startTime = time;
        this.updateTimer = true;
      }
      //if (this.timerStatus.progress < 0.99) {
      if (this.updateTimer && this.timerStatus.progress < 0.99) {
        //this.timerStatus.progress += this.progressUpdate;
        this.timerStatus.progress = ((time-this.startTime)/this.duration);
        this.notifyVisualTimer(this.timerStatus);
        this.visualTimer = window.requestAnimationFrame(updateVisualTimer.bind(this));
      }
    }
    /*jshint +W040 */

    // stop the timer
    Timer.prototype.stop = function() {
      $timeout.cancel(this.actualTimer);
      if (this.visual) {
        //$interval.cancel(this.visualTimer);
        window.cancelAnimationFrame(this.visualTimer);
        this.updateTimer = false;
        this.startTime = null;
      }
      return executableUtils.getTiming();
    };

    // inform the statusPanelService of the timer values
    Timer.prototype.notifyVisualTimer = function(timerStatus) {
      statusPanelService.updateTimer(timerStatus);
    };

    // cleans up the visual timer by setting end values
    Timer.prototype.endVisualTimer = function() {
      window.cancelAnimationFrame(this.visualTimer);
      this.updateTimer = false;
      this.startTime = null;
      //$interval.cancel(this.visualTimer);
      this.timerStatus.progress = 1;
      this.notifyVisualTimer(this.timerStatus);
    };

    Timer.prototype.reset = function() {
      this.timerStatus.progress = 0;
      this.notifyVisualTimer(this.timerStatus);
    };

    // gets called when timer is up
    Timer.prototype.timerUp = function() {
      var time = executableUtils.getTiming();
      if (this.visual) {
        this.endVisualTimer();
      }
      if (this.targetFunction) {
        this.targetFunction(time);
      }
    };

    return timerUtils;
}

export default TimerUtilsService;