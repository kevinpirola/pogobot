'use strict';

angular.module('pogobotFrontendApp').factory('Pokemon', ['$resource', function ($resource) {
    return $resource('http://kevinpirola.ddns.net:8080/api', {
        id: '@id'
    }, {
        getPkmn: {
            method: 'GET',
            url: 'http://kevinpirola.ddns.net:8080/api/user/:token/:lt/pkmns',
            params: {
                token: '@token',
                lt: '@lt'
            }
        }
    });
}]);