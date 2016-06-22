tatool.factory('stearcweek',['executableUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory', 'dbUtils',
function (executableUtils, timerUtils, stimulusServiceFactory, inputServiceFactory, dbUtils) {

    var STEARCweek = executableUtils.createExecutable();

    var DISPLAY_DURATION_DEFAULT = 2000;

    STEARCweek.prototype.init = function() {
        var deferred = executableUtils.createPromise();

        // Stimulus counter. One for each module name (3 in total: practice, A & B)
        this.counter = 0;
        this.continuepractice = true;

        // Randomise which condition starts first (but do it only once)
        var firsttime = false;
        try {
            if (randcond)
            firsttime = false;
        } catch(e) {
            firsttime = true;

        }
        if (firsttime){
            randcond = Math.round(Math.random());
        }

        // randcond (random generated number at start of session) XOR condtype (according to ABBA)
        // condtype is created in the Module
        if(randcond ^ this.condtype.propertyValue){
            this.condition = "LtoR";
            // Profit to create specific keyboard answers
            this.response1 = "Past";
            this.response2 = "Future";
            this.keyLabel1 = "Past < ";
            this.keyLabel2 = "> Future ";
        } else {
            this.condition = "RtoL";
            // Profit to create specific keyboard answers
            this.response2 = "Past";
            this.response1 = "Future";
            this.keyLabel2 = "> Past ";
            this.keyLabel1 = " Future <";
        }

        this.stimulusService = stimulusServiceFactory.createService(this.stimuliPath);
        this.inputService = inputServiceFactory.createService(this.stimuliPath);

        //The stimuli list is a CSV explained in Tatool UI
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
            function(list) {
                self.processStimuliFile(list, deferred);
            }, function(error) {
                deferred.reject(error);
            });

            //Create a timer object visible on top of the screen
            this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
            this.timer = timerUtils.createTimer(this.displayDuration, true, this);

            //Configure input
            this.keyCode1 = "ArrowLeft";
            this.keyCode2 = "ArrowRight";
            this.keyLabelType1 = "text";
            this.keyLabelType2 = "text";

            //Create an array of the names of the days of the week
            this.days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

            //Full date
            this.d = new Date();
            this.timezone = this.d.getTimezoneOffset();

            //Day of the week (in number) of today
            this.today = this.d.getDay();

            return deferred;
        };

        // process stimuli file according to randomisation property
        STEARCweek.prototype.processStimuliFile = function(list, deferred) {
            if (this.randomisation === 'full') {
                this.stimuliList = this.splitStimuliList(list);
            } else if (this.randomisation === 'pseudo') {
                this.stimuliList = this.pseudoStimuliList(list);
            } else {
                this.stimuliList = list;
            }

            deferred.resolve();
        };

        // Use only the right condition in a random order
        STEARCweek.prototype.splitStimuliList = function(list) {
            var newList = {};
            for (var i = 0; i < list.length; i++) {
                var stimulusType = list[i].stimulusType;
                if (!newList[stimulusType]) {
                    newList[stimulusType] = [];
                }
                newList[stimulusType].push(list[i]);
            }

            newList = executableUtils.shuffle(newList[this.condition]);

            return newList;
        };

        // Use only the right condition, randomly, but avoid more than 2 repetitions
        STEARCweek.prototype.pseudoStimuliList = function(list) {
            var newList = {};
            for (var i = 0; i < list.length; i++) {
                var stimulusType = list[i].stimulusType;
                if (!newList[stimulusType]) {
                    newList[stimulusType] = [];
                }
                newList[stimulusType].push(list[i]);
            }

            newList = executableUtils.shuffle(newList[this.condition]);

            var repeat = 0;
            var infiniteSafety = 0;

            var finalList = [];
            finalList[0] = newList.shift();
            while (newList.length > 0) {
                if (newList[0].relativeDay===finalList[finalList.length-1].relativeDay) {
                    if (repeat==1){
                        while (newList[0].relativeDay==finalList[finalList.length-1].relativeDay) {
                            newList = executableUtils.shuffle(newList);

                            // Have you tried ten times and still bad?
                            // It means there's not enough options anymore or
                            // you are at Monte-Carlo
                            infiniteSafety++;
                            if (infiniteSafety > 10) {
                                newList = newList.concat(finalList)
                                newList = executableUtils.shuffle(newList);
                                finalList = [];
                                finalList[0] = newList.shift();
                                break;
                            }
                        }
                        repeat = 0;
                    } else {
                        repeat = 1;
                    }
                }
                finalList[finalList.length] = newList.shift();
                infiniteSafety = 0;
            }

            return finalList;
        };

        STEARCweek.prototype.createStimulus = function() {
            //If the participant seems to have understood the task
            if(this.name == "stearcpractice") {
                var levelHandler = dbUtils.getHandler('levelHandler');
                var currentLevel = dbUtils.getModuleProperty(levelHandler, 'currentLevel');
                if (currentLevel > 4) {
                    this.fixationInterval = 0;
                    this.blankInterval = 0;
                    this.continuepractice = false;
                    this.timer = 'NULL';
                }
                if (!this.continuepractice) {
                    executableUtils.stop();
                }
            }



            //Get the stimulus
            var stimulus = executableUtils.getNext(this.stimuliList, this.counter);
            //Stimulus is relative to today
            daynum = (this.today + stimulus.relativeDay);
            //Days of the week only between 0 and 6
            if (daynum<0) {
                daynum += 7;
            } else if (daynum>6) {
                daynum -=7;
            }

            //Keep a record
            this.trial = {};
            this.trial.timezone = this.timezone;
            this.trial.timestamp = Date.now();
            this.trial.today = this.today;
            this.trial.stimulusType = stimulus.stimulusType;
            this.trial.dayofweek = daynum;
            this.trial.relativeDay = stimulus.relativeDay;
            this.trial.correctResponse = stimulus.correctResponse;

            //Show a day in name (ex: "Wednesday") instead of a number (3)
            stimulus.stimulusValue = this.days[daynum];
            this.stimulusService.setText(stimulus);

            //Add the keys at the buttom
            this.inputService.addInputKey(this.keyCode1, this.response1, this.keyLabel1, this.keyLabelType1);
            this.inputService.addInputKey(this.keyCode2, this.response2, this.keyLabel2, this.keyLabelType2);

            this.counter++;
        };

        STEARCweek.prototype.processResponse = function(response) {
            this.trial.reactionTime = this.endTime - this.startTime;
            this.trial.givenResponse = response;
            if (this.trial.correctResponse == this.trial.givenResponse) {
                this.trial.score = 1;
            } else {
                this.trial.score = 0;
            }
            dbUtils.saveTrial(this.trial).then(executableUtils.stop);
        };

        return STEARCweek;
    }]);
