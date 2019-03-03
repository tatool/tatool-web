'use strict';

PublicEndCtrl.$inject = ['$scope', 'publicService', '$window',];

function PublicEndCtrl($scope, publicService, $window) {
	if (publicService.getModule() != undefined) {
		if ($window.TatoolXP) {
			$window.TatoolXP.postMessage('sessionEnd');
		} else {
			$scope.message = 'This code confirms the completion of your session:';
			$scope.sessionToken = publicService.getSessionToken();
		}
	}
}

export default PublicEndCtrl;