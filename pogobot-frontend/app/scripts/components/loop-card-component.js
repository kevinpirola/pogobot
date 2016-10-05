'use strict';

angular.module('pogobotFrontendApp')
    .component('loop', {
        templateUrl: '/scripts/components/loop-card-component.html',
        bindings: {
            loop: '='
        }
    });