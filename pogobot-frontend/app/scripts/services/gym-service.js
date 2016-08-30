'use strict';

angular.module('pogobotFrontendApp')
    .factory('Gym', ['$resource', '$location', function ($resource, $location) {
        return $resource($location.protocol() + '://' + $location.host() + ':8080/api/gym/:id', {
            id: '@id'
        }, {
            growing: {
                method: 'GET',
                url: $location.protocol() + '://' + $location.host() + ':8080/api/gym/:id/growing',
                params: {
                    id: '@id'
                }
            },
            getPokemonList: {
                method: 'GET',
                url: $location.protocol() + '://' + $location.host() + ':8080/api/gym/:id/pokemon',
                params: {
                    id: '@id'
                }
            }
        });
    }]);