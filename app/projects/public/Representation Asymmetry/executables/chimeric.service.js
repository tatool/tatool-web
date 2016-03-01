tatool.factory('chimeric',['executableUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'dbUtils',
function (executableUtils, timerUtils, gridServiceFactory, inputServiceFactory, dbUtils) {

    var chimeric = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    chimeric.prototype.init = function() {
        var promise = executableUtils.createPromise();

        this.counter = 0;
        this.gridService = gridServiceFactory.createService(2, 1, 'gridService', this.stimuliPath);
        this.inputService = inputServiceFactory.createService(this.stimuliPath);

        //The stimuli list is a CSV explained in Tatool UI
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
            function(list) {
                self.stimuliList = executableUtils.shuffle(list);
                promise.resolve();
            }, function(error) {
                promise.reject(error);
            });

            //Allow only these answers
            this.keyCode1 = "ArrowUp";
            this.keyCode2 = "ArrowDown";

            //Create a timer object in the Executable service init method
            this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
            this.timer = timerUtils.createTimer(this.displayDuration, true, this);

            return promise;
        };

        // Adding keyInputs and show by default
        chimeric.prototype.setupInputKeys = function(stimulus) {
            //Answer mapping depends on condition.
            //Condition Up means : happy is left side of the upper image
            if (stimulus.stimulusType=="Up"){
                this.response1 = "Left";
                this.response2 = "Right";
            } else {
                this.response1 = "Right";
                this.response2 = "Left";
            }

            //Create the buttons
            this.inputService.addInputKey(this.keyCode1, this.response1, null, null, !this.showKeys.propertyValue);
            this.inputService.addInputKey(this.keyCode2, this.response2, null, null, !this.showKeys.propertyValue);
        };

        chimeric.prototype.createStimulus = function() {
            //Get the stimulus
            var stimulus = executableUtils.getNext(this.stimuliList, this.counter);

            //Keep a record
            this.trial = {};
            this.trial.stimulusType = stimulus.stimulusType;
            this.trial.stimulusValue = stimulus.stimulusValue;

            this.setupInputKeys(stimulus);

            this.celltop = {};
            this.celltop.gridPosition = 1;
            this.celltop.stimulusValue = stimulus.stimulusValue;
            this.celltop.stimulusValueType = 'image';
            this.celltop.gridCellClass = 'chimericStraight';

            this.cellbottom = {};
            this.cellbottom.gridPosition = 2;
            this.cellbottom.stimulusValue = stimulus.stimulusValue;
            this.cellbottom.stimulusValueType = 'image';
            this.cellbottom.gridCellClass = 'chimericStraight';

            if (stimulus.stimulusType=="Up"){
                this.cellbottom.gridCellClass = 'chimericReversed';
            } else {
                this.celltop.gridCellClass = 'chimericReversed';
            }

            //Show the image
            this.gridService.addCell(this.celltop);
            this.gridService.addCell(this.cellbottom);
            this.counter++;

        };

        chimeric.prototype.processResponse = function(response, inputMethod) {
            this.trial.reactionTime = this.endTime - this.startTime;
            this.trial.givenResponse = response;
            this.trial.inputMethod = inputMethod;
            dbUtils.saveTrial(this.trial).then(executableUtils.stop);
        };

        chimeric.prototype.stopExecution = function() {
            executableUtils.stop();
        };

        return chimeric;
    }]);
