'use strict';

/* global screenfull */
/* global async */
import screenfull from 'screenfull';
import async from 'async';

PublicRunCtrl.$inject = ['$scope', '$window', '$state', '$sce', '$log', 'spinnerService', 'authService', 'cfg', 'moduleDataService', 'userService', 'exportService', 'publicService'];

function PublicRunCtrl($scope, $window, $state, $sce, $log, spinnerService, authService, cfg, moduleDataService, userService, exportService, publicService) {

    var moduleId = publicService.getModuleId();
    var extid = publicService.getExtId();
    var extCondition = publicService.getExtCondition();

    // module listener
    var moduleListener = function(e) {
      var message = e.data;
      if (message.type === 'moduleLoaded') {
        stopSpinner();
      } else if (message.type === 'moduleExit') {
        if (screenfull.enabled) {
          screenfull.exit();
        }
        $scope.moduleUrl = $sce.trustAsResourceUrl('about:blank');
        $window.removeEventListener('message', moduleListener, false);
        if (screenfull.enabled) {
          $window.removeEventListener(screenfull.raw.fullscreenchange, fullscreenChange, false);
        }
        
        stopSpinner();
        $scope.$apply();

        if (message.errorMessage) {
          bootbox.dialog({
            closeButton: false,
            message: '<b>Tatool encountered an error during the module execution.</b> <br><br>' + message.errorMessage,
            title: '<b>Tatool</b>',
            buttons: {
              ok: {
                label: 'OK',
                className: 'btn-default',
                callback: runExport
              }
            }
          });
        } else {
          runExport();
        }
        
      }
    };

    var fullscreenChange = function() {
      if (!screenfull.isFullscreen) {
        $('#iframe')[0].contentWindow.postMessage({ type: 'fullscreenExit' }, '*');
      }
    };

    $window.addEventListener('message', moduleListener, false);

    // fullscreen change detection
    if (screenfull.enabled) {
      $window.addEventListener(screenfull.raw.fullscreenchange, fullscreenChange, false);
    }

    var startSpinner = function(message) {
      spinnerService.spin('loadingSpinner', message);
    };

    var stopSpinner = function() {
      spinnerService.stop('loadingSpinner');
    };


    function installModule() {
      moduleDataService.installModule(moduleId).then(function() {
        startModule();
      }, function() {
        authService.logout();
        $state.go('start');
      });
    }

    function startModule() {
      // set the moduleId as a session property
      $window.sessionStorage.setItem('moduleId', moduleId);
      $window.sessionStorage.setItem('mode', cfg.APP_MODE_PUBLIC);
      $window.sessionStorage.setItem('extCondition', extCondition);

      // open moduleUrl in Iframe
      if (moduleId) {
        startSpinner('Loading module...');
        $scope.moduleUrl = $sce.trustAsResourceUrl('../../moduleIndex.html#module');
      } else {
        authService.logout();
        $state.go('publicEnd');
      }
    }

    function runExport() {
      startSpinner('Saving data...');
      moduleDataService.getModule(moduleId).then(function(module) {
        publicService.setModule(module);
        doExport(module);
      }, function() {
        stopSpinner();
        authService.logout();
        $state.go('publicEnd');
      });
    }

    function doExport(module) {
      var exporters = module.moduleDefinition.export;
      async.eachSeries(exporters, exportModule.bind(null, module), function(err) {
        if (err) {
          $log.error(err);
        }
        stopSpinner();
        authService.logout();
        $state.go('publicEnd');
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

export default PublicRunCtrl;
