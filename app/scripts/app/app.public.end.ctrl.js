'use strict';

PublicEndCtrl.$inject = ['$scope', 'publicService'];

function PublicEndCtrl($scope, publicService) {
	if (publicService.getModule() != undefined) {
		$scope.message = 'This code confirms the completion of your session:';
		$scope.sessionToken = publicService.getSessionToken();
	}
}

export default PublicEndCtrl;