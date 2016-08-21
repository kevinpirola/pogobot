'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:GymsCtrl
 * @description
 * # GymsCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('GymsCtrl', ['Gym', function (Gym) {

        var self = this;
        self.gyms = [];

        Gym.get(null, function (res) {
            self.gyms = res.data;
        });

    }]);