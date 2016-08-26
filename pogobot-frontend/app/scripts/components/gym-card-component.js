'use strict';

angular.module('pogobotFrontendApp')
    .component('gym', {
        templateUrl: '/scripts/components/gym-card-component.html',
        bindings: {
            gym: '='
        },
        controller: ['Level', 'Gym', function (Level, Gym) {
            var self = this;
            self.nextLevelPoints = 0;

            Level.get({
                id: (self.gym.GD_LEVEL < 10) ? self.gym.GD_LEVEL + 1 : self.gym.GD_LEVEL
            }, function (res) {
                self.nextLevelPoints = res.data.L_MIN_POINTS;
            });

            Gym.growing({
                id: self.gym.G_ID
            }, function (res) {
                self.growing = res.growing;
            });

            self.getTeam = function (id) {
                var ret = '';
                switch (id) {
                case 1:
                    ret = 'mystic';
                    break;
                case 2:
                    ret = 'valor';
                    break;
                case 3:
                    ret = 'instinct';
                    break;
                }
                return ret;
            };

        }]
    });