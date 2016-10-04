'use strict';

angular.module('pogobotFrontendApp')
    .component('gym', {
        templateUrl: '/scripts/components/gym-card-component.html',
        bindings: {
            gym: '='
        },
        controller: ['Level', function (Level) {
            var self = this;
            self.nextLevelPoints = 0;

            var level = Level.get((self.gym.GD_LEVEL < 10) ? self.gym.GD_LEVEL + 1 : self.gym.GD_LEVEL);
            self.nextLevelPoints = level.L_MIN_POINTS;
	    
	    self.growing = self.gym.GD_IS_GROWING;

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
