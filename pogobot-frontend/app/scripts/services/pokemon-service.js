'use strict';

angular.module('pogobotFrontendApp').factory('Pokemon', ['$resource', '$location', function ($resource, $location) {
    return $resource($location.protocol() + '://' + $location.host() + ':8080/api', {
        id: '@id'
    }, {
        getPkmn: {
            method: 'GET',
            url: $location.protocol() + '://' + $location.host() + ':8080/api/user/:token/:lt/pkmns',
            params: {
                token: '@token',
                lt: '@lt'
            }
        }
    });
}]);
