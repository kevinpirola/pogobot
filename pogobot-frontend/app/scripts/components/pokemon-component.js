'use strict';

angular.module('pogobotFrontendApp')
    .component('pokemon', {
        templateUrl: '/scripts/components/pokemon-component.html',
        bindings: {
            pokemon: '='
        }
    });