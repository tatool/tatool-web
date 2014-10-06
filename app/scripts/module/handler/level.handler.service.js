'use strict';

angular.module('tatool.module')
  .factory('levelHandler', ['$log', '$rootScope', 'statusPanelService', 'handlerService', 'tatoolPhase', 'moduleService', 'trialService',
    function ($log, $rootScope, statusPanelService, handlerService, tatoolPhase, moduleService, trialService) {

    // create a new handler object and set all handler properties
    var LevelHandler = function() {
      // internal properties
      this.currentLevel = 1;
      this.counter = 0;
      this.totalScore = 0;
      this.maxScore = 0;

      // preset properties that can be overwritten by properties in module file
      this.sampleSize = 3;
      this.benchmarkSampleSize = 3;
      this.benchmark = 0.6;
    };

    // listens to phase changes and triggers the handler
    LevelHandler.prototype.processPhase = function(phase) {
      if (phase == tatoolPhase.SESSION_START) {
        // get values from module
        this.counter = (moduleService.getModuleProperty(this.name + '.counter') != undefined) 
                          ? moduleService.getModuleProperty(this.name + '.counter') : 0;
        this.totalScore = (moduleService.getModuleProperty(this.name + '.totalScore') != undefined) 
                            ? moduleService.getModuleProperty(this.name + '.totalScore') : 0;
        this.maxScore = (moduleService.getModuleProperty(this.name + '.maxScore') != undefined) 
                            ? moduleService.getModuleProperty(this.name + '.maxScore') : 0;
        this.currentLevel = (moduleService.getModuleProperty(this.name + '.currentLevel') != undefined) 
                              ? moduleService.getModuleProperty(this.name + '.currentLevel') : 1;
      } else if (phase == tatoolPhase.EXECUTABLE_START) {
        this.updateStatusPanel();
      } else if (phase == tatoolPhase.EXECUTABLE_END) {
        this.processItems();
      }
    };

    // process trials and decide on level-up
    LevelHandler.prototype.processItems = function() {

      // loop through trials and increment totalScore
      var trials = trialService.getCurrentTrials();
      for (var i = 0; i < trials.length; i++) {
        var currentTrial = trials[i];
        if ('score' in currentTrial) {
          this.totalScore += currentTrial.score;
          this.maxScore++;
        }
      }

      // if all child elements are completed (especially dual elements), process level
      if (handlerService.allDualsCompleted(this)) {
        this.counter++;
        if (this.counter == this.benchmarkSampleSize) {
          var performance = this.totalScore / this.maxScore;
          if (performance >= this.benchmark) {
            this.currentLevel++;
            $rootScope.$broadcast(tatoolPhase.LEVEL_CHANGE, this.currentLevel);
          }
          this.counter = 0;
          this.totalScore = 0;
          this.maxScore = 0;
        }
      }

      // save current property values to module
      moduleService.setModuleProperty(this.name + '.counter', this.counter);
      moduleService.setModuleProperty(this.name + '.totalScore', this.totalScore);
      moduleService.setModuleProperty(this.name + '.maxScore', this.totalScore);
      moduleService.setModuleProperty(this.name + '.currentLevel', this.currentLevel);
    };

    // returns the current level
    LevelHandler.prototype.getCurrentLevel = function() {
      return this.currentLevel;
    };

    // updates the status panel
    LevelHandler.prototype.updateStatusPanel = function() {
      statusPanelService.updateLevel(this.currentLevel);
    };

    return LevelHandler;    
  }]);
