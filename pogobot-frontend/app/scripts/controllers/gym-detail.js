'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:GymDetailCtrl
 * @description
 * # GymDetailCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('GymDetailCtrl', ['$stateParams', 'Gym', 'Level', function ($stateParams, Gym, Level) {

        var self = this;
        self.gym = {};
        self.pokemons = [];
        self.id = $stateParams.id;

        self.nextLevelPoints = 0;

        Gym.get({
            id: self.id
        }, function (res) {
            self.gym = res.data;
            var level = Level.get((self.gym.GD_LEVEL < 10) ? self.gym.GD_LEVEL + 1 : self.gym.GD_LEVEL);
            self.nextLevelPoints = level.L_MIN_POINTS;
        });

        Gym.getPokemonList({
            id: self.id
        }, function (res) {
            self.pokemons = res.data;
        });
    }]);
