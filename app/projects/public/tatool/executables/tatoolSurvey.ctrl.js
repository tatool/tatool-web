'use strict';

tatool
  .controller('tatoolSurveyCtrl', ['$scope', 'service', 'moduleService',
    function ($scope, service, moduleService) {

    var myCss = {

    };

    $scope.start = function() {
    	var survey = new service.Survey.Model(service.surveyJSON);

      //Create showdown markdown converter
      var converter = new showdown.Converter();

      survey
      .onTextMarkdown
      .add(function (survey, options) {

        //convert the markdown text to html
        var str = converter.makeHtml(options.text);

        //remove root paragraphs <p></p>
        str = str.substring(3);
        str = str.substring(0, str.length - 4);

        //set html
        options.html = str;
      });

      $("#surveyContainer").Survey({
        model: survey,
        onComplete: service.saveSurvey,
        css: myCss
      });
    };
  }]);
