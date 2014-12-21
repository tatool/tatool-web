'use strict';

tatool
  .factory('tatoolCountdown', [ 'executableUtils', 'timerUtils',
    function (executableUtils, timerUtils) {

    var TatoolCountdown = executableUtils.createExecutable();

    var DEFAULT_COUNTDOWN = 5;
    var DEFAULT_INTERVAL = 600;
    var DEFAULT_GO_TEXT = 'Go!'

    TatoolCountdown.prototype.init = function() {
      this.goText = this.goText || DEFAULT_GO_TEXT;
      this.countDownFrom = this.countdown || DEFAULT_COUNTDOWN;
      var countDownInterval = this.interval || DEFAULT_INTERVAL;
      this.timer = timerUtils.createTimer(countDownInterval, false, this);
    };

    TatoolCountdown.prototype.resetCountDown = function() {
      this.countDownFrom = this.countdown || DEFAULT_COUNTDOWN;
    };

    TatoolCountdown.prototype.stopExecutable = function() {
      executableUtils.stop();
    };

    return TatoolCountdown;
  }]);
