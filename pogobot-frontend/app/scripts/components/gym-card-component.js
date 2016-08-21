'use strict';

angular.module('pogobotFrontendApp')
    .component('gym', {
        templateUrl: '/scripts/components/gym-card-component.html',
        bindings: {
            gym: '='
        },
        controller: function () {
            var self = this;
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

            self.getLevel = function (points) {
                var level = 1;
                if (points >= 2000) {
                    level = 2;
                    if (points >= 4000) {
                        level = 3;
                        if (points >= 8000) {
                            level = 4;
                            if (points >= 12000) {
                                level = 5;
                                if (points >= 16000) {
                                    level = 6;
                                    if (points >= 20000) {
                                        level = 7;
                                        if (points >= 30000) {
                                            level = 8;
                                            if (points >= 40000) {
                                                level = 9;
                                                if (points >= 50000) {
                                                    level = 10;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return level;

            };
        }
    });