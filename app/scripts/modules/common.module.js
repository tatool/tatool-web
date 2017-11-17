'use strict';

import angular from 'angular';

import tatool from './app.js';

import MessageService from '../common/message.service.js';
import { SpinnerService, TatoolSpinner } from '../common/spinner.service.js';

var tatoolCommon = angular.module('tatool.common', [tatool])
  .config([ function () {

}]);

tatoolCommon.factory('messageService', MessageService);
tatoolCommon.factory('spinnerService', SpinnerService);
tatoolCommon.directive('tatoolSpinner', TatoolSpinner);

export default tatoolCommon.name;