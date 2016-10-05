'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:LoopsCtrl
 * @description
 * # LoopsCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('LoopsCtrl', ['Loop', function (Loop) {

        var self = this;
        self.loops = [];

        Loop.get(null, function (res) {
            self.loops = res.data;
        });
    }]);