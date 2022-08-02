'use strict';

tatool.$inject = ['$window'];

tatool
    .factory('tatoolSurvey', ['executableUtils', 'dbUtils', 'timerUtils', 'stimulusServiceFactory', 'inputServiceFactory', '$window',
        function(executableUtils, dbUtils, timerUtils, stimulusServiceFactory, inputServiceFactory, $window) {

            var TatoolSurvey = executableUtils.createExecutable();

            TatoolSurvey.prototype.init = function() {
                var deferred = executableUtils.createPromise();

                this.Survey = Survey;
                this.Survey.StylesManager.applyTheme('modern');

                var self = this;
                executableUtils.getJSONResource(this.stimuliFile, this.stimuliPath).then(
                    function(data) {
                        self.surveyJSON = data;
                        deferred.resolve();
                    },
                    function(error) {
                        deferred.reject(error);
                    });

                return deferred;
            };

            TatoolSurvey.prototype.saveSurvey = async function(survey) {

                for (var key in survey.data) {
                    if (survey.data.hasOwnProperty(key)) {
                        if (survey.data[key] instanceof Object) {
                            for (const [o_key, o_value] of Object.entries(survey.data[key])) {
                                var trial = {}
                                trial.stimulusValue = o_key;
                                trial.givenResponse = o_value;
                                await dbUtils.saveTrial(trial);
                            }
                        } else {
                            var trial = {};
                            trial.stimulusValue = key;
                            trial.givenResponse = survey.data[key];
                            await dbUtils.saveTrial(trial);
                        }
                    }
                }

                executableUtils.stop();

            }

            return TatoolSurvey;

        }
    ]);