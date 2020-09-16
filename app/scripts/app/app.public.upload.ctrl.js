'use strict';

/* global async */
import async from 'async';

PublicUploadCtrl.$inject = ['$scope', '$state', '$log', 'spinnerService', 'authService', 'cfg', 'moduleDataService', 'userService', 'exportService', 'publicService'];

function PublicUploadCtrl($scope, $state, $log, spinnerService, authService, cfg, moduleDataService, userService, exportService, publicService) {

  var moduleId = publicService.getModuleId();
  var extid = publicService.getExtId();
  var extCondition = publicService.getExtCondition();

  var startSpinner = function(message) {
    spinnerService.spin('loadingSpinner', message);
  };

  var stopSpinner = function() {
    spinnerService.stop('loadingSpinner');
  };

  function showMessage(message) {
    $scope.message = message;
  }

  function installModule() {
    startSpinner('Uploading data...');
    moduleDataService.installModule(moduleId).then(function() {
      runExport();
    }, function() {
      authService.logout();
      $state.go('start');
    });
  }

  function runExport() {
    moduleDataService.getModule(moduleId).then(function(module) {
      publicService.setModule(module);
      doExport(module);
    }, function() {
      stopSpinner();
      authService.logout();
    });
  }

  function doExport(module) {
    var exporters = module.moduleDefinition.export;
    async.eachSeries(exporters, exportModule.bind(null, module), function(err) {
      if (err) {
        $log.error(err);
        showMessage(err);
      } else {
        showMessage('Upload successful.');
      }
      stopSpinner();
      authService.logout();
    });
  }

  var exportModule = function(module, exporter, callbackExport) {
    if (exporter.enabled === true && exporter.auto === true) {
      exportService.exportModuleData(module, exporter.mode, exporter.target, cfg.APP_MODE_PUBLIC).then(function() {
        callbackExport();
      }, function(error) {
        callbackExport(error);
      });
    } else {
      callbackExport();
    }
  };

  authService.publicLogin(moduleId, extid).then(function() {
    moduleDataService.openModulesDB(userService.getUserName(), cfg.APP_MODE_PUBLIC, null);
    installModule();
  }, function() {
    $state.go('start');
  });

}

export default PublicUploadCtrl;