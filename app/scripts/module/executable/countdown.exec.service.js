'use strict';

angular.module('tatool.module')
  .factory('tatoolCountdown', [ '$log', 'tatoolExecutable', 'timerService',
    function ($log, tatoolExecutable, timerService) {

    var TatoolCountdown = tatoolExecutable.createExecutable();

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
      tatoolExecutable.stopExecutable();
    };

    return TatoolCountdown;
  }]);
