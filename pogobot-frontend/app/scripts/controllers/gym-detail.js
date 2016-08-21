'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:GymDetailCtrl
 * @description
 * # GymDetailCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('GymDetailCtrl', ['$stateParams', 'Gym', function ($stateParams, Gym) {

        var self = this;
        self.gym = {};
        self.id = $stateParams.id;

        Gym.get({
            id: self.id
        }, function (res) {
            self.gym = res.data;
        });
    }]);