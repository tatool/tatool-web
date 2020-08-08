'use strict';

LevelHandlerService.$inject = ['$log', '$rootScope', 'statusPanelService', 'handlerService', 'tatoolPhase', 'moduleService', 'trialService'];

function LevelHandlerService($log, $rootScope, statusPanelService, handlerService, tatoolPhase, moduleService, trialService) {

    // create a new handler object and set all handler properties
    var LevelHandler = function() {
      // internal properties
      this.currentLevel = 1;
      this.counter = 0;
      this.totalScore = 0;
      this.maxScore = 0;

      // preset properties that can be overwritten by properties in module file
      this.benchmarkSampleSize = 3;
      this.benchmark = 0.6;
      this.allowLevelDown = { propertyType: 'Boolean', propertyValue: false };

      // enable setting a range where difficulty is maintained 
      this.setBenchmarkRange = { propertyType: 'Boolean', propertyValue: false }; 
      this.lowerBenchmark = 0.4;

      // settings for handling of reaction times
      this.enableReactionTimeBenchmark = { propertyType: 'Boolean', propertyValue: false };
      this.reactionTimeList = [];
      this.medianReactionTime = 0;
      this.reactionTimeBenchmark = 5000;

      // enable setting a range where difficulty is maintained 
      this.setReactionTimeBenchmarkRange = { propertyType: 'Boolean', propertyValue: false }; 
      this.lowerReactionTimeBenchmark = 1500;
    };

    // listens to phase changes and triggers the handler
    LevelHandler.prototype.processPhase = function(phase) {
      if (phase === tatoolPhase.SESSION_START) {
        // get values from module
        this.counter = (moduleService.getModuleProperty(this, 'counter') !== undefined) ? moduleService.getModuleProperty(this, 'counter') : 0;
        this.totalScore = (moduleService.getModuleProperty(this, 'totalScore') !== undefined) ? moduleService.getModuleProperty(this, 'totalScore') : 0;
        this.maxScore = (moduleService.getModuleProperty(this, 'maxScore') !== undefined) ? moduleService.getModuleProperty(this, 'maxScore') : 0;
        this.currentLevel = (moduleService.getModuleProperty(this, 'currentLevel') !== undefined) ? moduleService.getModuleProperty(this, 'currentLevel') : 1;

      } else if (phase === tatoolPhase.EXECUTABLE_START) {
        this.updateStatusPanel();
      } else if (phase === tatoolPhase.EXECUTABLE_END) {
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

        if ('reactionTime' in currentTrial) {
          this.reactionTimeList.push(currentTrial.reactionTime);
        }
      }

      // if all child elements are completed (especially dual elements), process level
      if (handlerService.allDualsCompleted(this)) {
        this.counter++;
        if (this.counter >= this.benchmarkSampleSize) {
          var performance = this.totalScore / this.maxScore;

          // compute median reaction time
          this.medianReactionTime = median(this.reactionTimeList);

          // create variables to check performance & reaction times first to simplify following code
          var passedUpperScoreBenchmark = false;
          var failedLowerScoreBenchmark = false;
          var passedUpperReactionTimeBenchmark = false;
          var failedLowerReactionTimeBenchmark = false;

          var levelUp = false;
          var levelDown = false; 

          // check whether score exceeds upper benchmark
          if (performance >= this.benchmark) {
            passedUpperScoreBenchmark = true;
          } 

          // check whether score is below lower benchmark
          if (this.setBenchmarkRange.propertyValue) {
            if (performance <= this.lowerBenchmark) {
              failedLowerScoreBenchmark = true;
            }
          }

          // for reaction times, smaller values reflect "better" performance
          if (this.medianReactionTime <= this.reactionTimeBenchmark) {
            passedUpperReactionTimeBenchmark = true;
          } 

          if (this.setReactionTimeBenchmarkRange.propertyValue) {
            if (this.medianReactionTime >= this.lowerReactionTimeBenchmark) {
              failedLowerReactionTimeBenchmark = true;
            }
          }

          // adjust level based on scores and reaction times
          if (this.enableReactionTimeBenchmark.propertyValue) {
              if (passedUpperScoreBenchmark && passedUpperReactionTimeBenchmark) {
                levelUp = true;

                // legacy routine for adjusting downward without benchmark range
              } else if (this.allowLevelDown.propertyValue && this.currentLevel > 1) {
                if (!this.setBenchmarkRange.propertyValue && !this.setReactionTimeBenchmarkRange.propertyValue) {
                  levelDown = true;

                  // adjust based on lower benchmarks
                } else if ((this.setBenchmarkRange.propertyValue && failedLowerScoreBenchmark) ||
                  (this.setReactionTimeBenchmarkRange.propertyValue && failedLowerReactionTimeBenchmark)) {
                  levelDown = true;
                }
              }

          // adjust level based on scores only
          } else {
            if (passedUpperScoreBenchmark) {
              levelUp = true;
            } else if (this.allowLevelDown.propertyValue && this.currentLevel > 1) {

              // legacy routine for adjusting downward without benchmark range
              if (!this.setBenchmarkRange.propertyValue) {
                levelDown = true;

                // adjust based on lower benchmark
              } else if (failedLowerScoreBenchmark) {
                levelDown = true;
              }
            }
          }

          if (levelUp) {
            this.currentLevel++;
            $rootScope.$broadcast(tatoolPhase.LEVEL_CHANGE, this.currentLevel);
          } else if (levelDown) {
            this.currentLevel--;
            $rootScope.$broadcast(tatoolPhase.LEVEL_CHANGE, this.currentLevel);
          }

          this.counter = 0;
          this.totalScore = 0;
          this.maxScore = 0;

          // reset reactionTime variables
          this.reactionTimeList = [];
          this.medianReactionTime = 0;
        }
      }

      // save current property values to module (note that RTs cannot be carried over across sessions)
      moduleService.setModuleProperty(this, 'counter', this.counter);
      moduleService.setModuleProperty(this, 'totalScore', this.totalScore);
      moduleService.setModuleProperty(this, 'maxScore', this.totalScore);
      moduleService.setModuleProperty(this, 'currentLevel', this.currentLevel);
    };

    // returns the current level
    LevelHandler.prototype.getCurrentLevel = function() {
      return this.currentLevel;
    };

    // updates the status panel
    LevelHandler.prototype.updateStatusPanel = function() {
      statusPanelService.updateLevel(this.currentLevel);
    };

    // helper function to compute the median
    function median(numbers) {
      var median = 0;
      var numsLen = numbers.length;

      numbers.sort(function(a, b){return a - b});

      if (numsLen % 2 === 0) { // is even
        // average of two middle numbers
        median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
      } else { // is odd
        // middle number only
        median = numbers[(numsLen - 1) / 2];
      }
 
      return median;
    };

    return LevelHandler;    
}

export default LevelHandlerService;
