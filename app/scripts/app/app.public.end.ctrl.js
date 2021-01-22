'use strict';

PublicEndCtrl.$inject = ['$scope', 'publicService', '$window', '$state'];

function PublicEndCtrl($scope, publicService, $window, $state) {
	if (publicService.getModule() != undefined) {
		if ($window.TatoolXP) {
			$window.TatoolXP.postMessage('sessionEnd');
		} else {
			$scope.message = 'This code confirms the completion of your session:';
			$scope.sessionToken = publicService.getSessionToken();
		}
	} else {
		$state.go('start');
	}
}

export default PublicEndCtrl;