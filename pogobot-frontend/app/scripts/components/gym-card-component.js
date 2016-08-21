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
                console.log('id');
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
        }
    });