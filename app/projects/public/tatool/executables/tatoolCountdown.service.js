'use strict';

tatool
  .factory('tatoolCountdown', [ 'executableUtils', 'timerService',
    function (executableUtils, timerService) {

    var TatoolCountdown = executableUtils.createExecutable();

    var DEFAULT_COUNTDOWN = 5;
    var DEFAULT_INTERVAL = 600;

    TatoolCountdown.prototype.init = function() {
      this.countDownFrom = this.countdown || DEFAULT_COUNTDOWN;
      var countDownInterval = this.interval || DEFAULT_INTERVAL;
      this.timer = timerService.createTimer(countDownInterval, false, this);
    };

    TatoolCountdown.prototype.resetCountDown = function() {
      this.countDownFrom = this.countdown || DEFAULT_COUNTDOWN;
    };

    TatoolCountdown.prototype.stopExecutable = function() {
      executableUtils.stop();
    };

    return TatoolCountdown;
  }]);
