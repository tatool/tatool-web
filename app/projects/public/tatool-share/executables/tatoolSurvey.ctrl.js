'use strict';

tatool
  .controller('tatoolSurveyCtrl', ['$scope', 'service', 'moduleService',
    function ($scope, service, moduleService) {

    var myCss = {
   		footer: "",
   		question: {
			"title": "surveyquestion"
		},
		boolean: {
			"label": "surveyquestion",
		},
	};

    $scope.start = function() {
    	var survey = new service.Survey.Model(service.surveyJSON);

        $("#surveyContainer").Survey({
        	model: survey,
        	onComplete: service.saveSurvey,
        	
        });
    };


  }]);
