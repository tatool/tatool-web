tatool.controller('chimericCtrl', [ '$scope', 'service',
function ($scope, service) {

    $scope.gridService = service.gridService;
    $scope.inputService = service.inputService;

    // What to do a the start of each trial
    $scope.start = function() {
        // Get the next stimuli on the list and put it in the right place
        service.createStimulus();

        // Show the keys at the bottom of the screen
        service.inputService.show();

        // Show the images and start the timer at the same time
        service.startTime = service.gridService.show();
        displayStimulus();
    };

    function displayStimulus() {
        // Just the visual timer, not for RT
        service.timer.start(timerUp);
        // Clear the screen in case something was still there
        service.gridService.refresh();
        // Allow keys and mouse clicks
        service.inputService.enable();
    }

    // Called by timer when time elapsed without user input
    function timerUp() {
        service.inputService.disable();
        service.endTime = service.gridService.clear().refresh();
        // The answer is set to empty
        service.processResponse('Timeout');
    }

    // Called when one of the right key is pressed
    $scope.inputAction = function(input, timing, event) {
        service.inputService.disable();
        service.gridService.clear().refresh();
        service.endTime = timing;
        service.processResponse(input.givenResponse, 'key');
    };

    // Called when clicked on the face directly
    $scope.userClick = function(cell, timing, $event) {
        if(cell.gridCellClass=="chimericStraight"){
            var response = "Left" ;
        } else {
            var response = "Right" ;
        }
        service.inputService.disable();
        service.gridService.clear().refresh();
        service.endTime = timing;
        service.processResponse(response, 'click');
    }

}]);
