'use strict'

tatool.factory('chimeric',['executableUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'dbUtils',
function (executableUtils, timerUtils, gridServiceFactory, inputServiceFactory, dbUtils) {

    var chimeric = executableUtils.createExecutable();

    // Fallback parameter is case nothing is set in the module
    var DISPLAY_DURATION_DEFAULT = 2000;

    chimeric.prototype.init = function() {
        var deferred = executableUtils.createPromise();

        // Trial counter
        this.counter = 0;

        // Tatool template stimulus grid
        this.gridService = gridServiceFactory.createService(2, 1, 'gridService', this.stimuliPath);

        // Tatool template inputs (key and mouse)
        this.inputService = inputServiceFactory.createService(this.stimuliPath);

        // Need a Path defined in the module
        if (!this.stimuliPath) {
          deferred.reject('Invalid property settings for Executable chimeric. Expected property <b>stimuliPath</b> of type Path.');
        }

        //The stimuli list is a CSV not hosted on Github
        if (this.stimuliFile) {
            var self = this;
            executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
                function(list) {
                    // Random presentation order of the stimuli
                    self.stimuliList = executableUtils.shuffle(list);
                    deferred.resolve();
                }, function(error) {
                    deferred.reject('Resource not found: ' + self.stimuliFile.resourceName);
                });
        } else {
            deferred.reject('Invalid property settings for Executable chimeric. Expected property <b>stimuliFile</b> of type Resource.');

        }

            //Allow only these answers
            this.keyCode1 = "ArrowUp";
            this.keyCode2 = "ArrowDown";

            //Create a timer object for a visual timer
            this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
            this.timer = timerUtils.createTimer(this.displayDuration, true, this);

            return deferred;
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

            // See above for the function
            this.setupInputKeys(stimulus);

            // Create a grid of two vertical cells
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

            // Mirror one of the image trough CSS
            if (stimulus.stimulusType=="Up"){
                this.cellbottom.gridCellClass = 'chimericReversed';
            } else {
                this.celltop.gridCellClass = 'chimericReversed';
            }

            //Show the images
            this.gridService.addCell(this.celltop);
            this.gridService.addCell(this.cellbottom);
            this.counter++;

        };

        chimeric.prototype.processResponse = function(response, inputMethod) {
            if(response=='Timeout'){
                this.trial.reactionTime = 'NA';
                this.trial.key = 'NA';
            } else {
                this.trial.reactionTime = this.endTime - this.startTime;
                if (this.trial.stimulusType=="Up"){
                    if(response=="Left")
                    {
                        this.trial.key = "Up"
                    } else {
                        this.trial.key = "Down"
                    }
                } else {
                    if(response=="Left")
                    {
                        this.trial.key = "Down"
                    } else {
                        this.trial.key = "Up"
                    }
                }
            }
            this.trial.givenResponse = response;

            this.trial.inputMethod = inputMethod;
            dbUtils.saveTrial(this.trial).then(executableUtils.stop);
        };

        chimeric.prototype.stopExecution = function() {
            executableUtils.stop();
        };

        return chimeric;
    }]);
