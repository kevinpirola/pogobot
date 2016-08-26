'use strict';

angular.module('pogobotFrontendApp')
    .factory('Level', ['$resource', '$location', function ($resource, $location) {
        return $resource($location.protocol() + '://' + $location.host() + ':8080/api/level/:id', {
            id: '@id'
        });
    }]);