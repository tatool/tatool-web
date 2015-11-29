tatool.factory('towerOfFameTraining', ['executableUtils', 'stimulusServiceFactory', 'inputServiceFactory', 'dbUtils', 'timerUtils',
  function(executableUtils, stimulusServiceFactory, inputServiceFactory, dbUtils, timerUtils) {

    var TowerOfFameTraining = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 4750;
    var INTERVAL_DURATION_DEFAULT = 250;

    TowerOfFameTraining.prototype.init = function() {
      var promise = executableUtils.createPromise();

      // timing properties
      this.displayDuration = (this.displayDuration) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.intervalDuration = (this.intervalDuration) ? this.intervalDuration : INTERVAL_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, false, this);
      this.timerIntervalMemoranda = timerUtils.createTimer(this.intervalDuration, false, this);

      this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      var self = this;
      executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
        function(list) {
          self.celebrities = list;
          promise.resolve();
        }, function(error) {
          promise.reject(error);
        });

      return promise;
    };

    TowerOfFameTraining.prototype.createStimulus = function() {
      // reset executable properties
      this.startTime = 0;
      this.endTime = 0;
      this.memCounter = 0;
      this.respCounter = 0;

      var levelHandler = dbUtils.getHandler('towerOfFameLevel');
      var currentLevel = dbUtils.getModuleProperty(levelHandler, 'currentLevel');

      if (currentLevel == null) {
        currentLevel = 1;
      }

      var currentCelebrities = angular.copy(this.celebrities);

      // fill appartments array with appartments ranging from 1A to 6D
      var appartments = [];
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 4; j++) {
          var n = appartments.length
          switch (j) {
            case 0:
              appartments[n] = i + 1 + "A";
              break;
            case 1:
              appartments[n] = i + 1 + "B";
              break;
            case 2:
              appartments[n] = i + 1 + "C";
              break;
            case 3:
              appartments[n] = i + 1 + "D";
              break;
          }
        }
      }

      console.log("current level: ", currentLevel)
      var nStimuli = 2;

      if (currentLevel <= 2) {
        nStimuli = 2;
      } else if (currentLevel <= 4) {
        nStimuli = 3;
      } else if (currentLevel <= 6) {
        nStimuli = 4;
      } else if (currentLevel <= 8) {
        nStimuli = 5;
      } else if (currentLevel <= 10) {
        nStimuli = 6;
      } else if (currentLevel <= 12) {
        nStimuli = 7;
      } else if (currentLevel <= 14) {
        nStimuli = 8;
      } else if (currentLevel <= 16) {
        nStimuli = 9;
      } else if (currentLevel <= 18) {
        nStimuli = 10;
      } else {
        nStimuli = 10;
      }

      // create prompts array
      var prompts = [];
      for (i = 0; i < nStimuli; i++) {
        prompts[i] = i + 1;
      }

      this.promptsRand = 0;

      // shuffle recall prompt order for even levels
      if (currentLevel % 2 == 0) {
        prompts = executableUtils.shuffle(prompts);
        this.promptsRand = 1;
      }

      // create stimulus
      this.stimulus = new Array();

      // create stimulus properties
      this.stimulus['stimulusCount'] = nStimuli;

      for (var j = 1; j < nStimuli + 1; j++) {
        this.stimulus['stimulusValueType' + j] = 'text';
        this.stimulus['stimulusValue' + j] = executableUtils.getRandom(currentCelebrities).name;
        this.stimulus['promptValue' + j] = executableUtils.getNext(prompts, j - 1);
        this.stimulus['correctResponse' + j] = executableUtils.getRandom(appartments);
      }

      for (var index in this.stimulus) {
        console.log(index + " : " + this.stimulus[index]);
      }
    };

    TowerOfFameTraining.prototype.setStimulus = function() {
      var stimulusText = this.concatStimulus();

      this.stimulusService.set({
        stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter],
        stimulusValue: stimulusText
      });
    };

    TowerOfFameTraining.prototype.concatStimulus = function() {
      var name = this.stimulus['stimulusValue' + this.memCounter];
      var apartment = this.stimulus['correctResponse' + this.memCounter];
      var lastItem = this.memCounter - 1

      if (this.memCounter == 1) {
        text = name + ' wohnt in Wohnung ' + apartment + '.'
      } else {
        var lastNeighbor = this.stimulus['stimulusValue' + lastItem]
        var lastApartment = this.stimulus['correctResponse' + lastItem]
        var floorDiff = parseInt(lastApartment.substr(0, 1)) - parseInt(apartment.substr(0, 1));
        var location = lastApartment.substr(1, 1) + apartment.substr(1, 1)

        if (floorDiff === 0) {
          var floorDiffText = ' auf der gleichen Etage wie '
        } else if (floorDiff < 0) {
          if (floorDiff === -1) {
            var floorDiffText = ' 1 Etage h\u00f6her als '
          } else {
            var floorDiffText = Math.abs(floorDiff) + ' Etagen h\u00f6her als '
          }
        } else {
          if (floorDiff === 1) {
            var floorDiffText = ' 1 Etage tiefer als '
          } else {
            var floorDiffText = floorDiff + ' Etagen tiefer als '
          }
        }

        if (location == 'AB' || location == 'BA' || location == 'CD' || location == 'DC') {
          var locationText = ' in der Wohnung nebenan.'
        } else if (location == 'AC' || location == 'CA' || location == 'BD' || location == 'DB') {
          var locationText = ' in der Wohnung gegen\u00fcber.'
        } else if (location == 'CB' || location == 'DA' || location == 'BC' || location == 'AD') {
          var locationText = ' in der Wohnung schr\u00e4g gegen\u00fcber.'
        } else if (location == 'AA' || location == 'BB' || location == 'CC' || location == 'DD') {
          if (floorDiff > 0) {
            var locationText = ' in der Wohnung direkt darunter.'
          } else {
            var locationText = ' in der Wohnung direkt dar\u00fcber.'
          }
        }

        text = name + ' wohnt ' + floorDiffText + lastNeighbor + locationText
      }

      return text;
    }

    TowerOfFameTraining.prototype.setRecallPrompt = function() {

      for (var i = 1; i < this.stimulus.stimulusCount + 1; i++) {
        var prompt = this.stimulus['promptValue' + i];

        if (prompt === this.respCounter) {
          this.stimulusService.set({
            stimulusValueType: this.stimulus['stimulusValueType' + i],
            stimulusValue: this.stimulus['stimulusValue' + i] + ' wohnt in Wohnung: '
          });
          this.correctResponse = this.stimulus['correctResponse' + i];
          break;
        }

      }
    };

    // Process given response
    TowerOfFameTraining.prototype.addTrial = function(givenResponse) {
      this.trial = {};
      this.trial.setSize = this.stimulus.stimulusCount;
      this.trial.reactionTime = this.endTime - this.startTime;
      this.trial.givenResponse = givenResponse;
      this.trial.correctResponse = this.correctResponse;
      this.trial.randomized = this.promptsRand;

      if (this.trial.correctResponse == this.trial.givenResponse) {
        this.trial.score = 1;
      } else {
        this.trial.score = 0;
      }

      return dbUtils.saveTrial(this.trial);
    };

    // Stop executable
    TowerOfFameTraining.prototype.stopExecution = function() {
      executableUtils.stop();
    };

    return TowerOfFameTraining;
  }
]);