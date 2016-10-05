'use strict';

angular.module('pogobotFrontendApp')
    .factory('Loop', ['$resource', '$location', function ($resource, $location) {
        return $resource($location.protocol() + '://' + $location.host() + ':8080/api/loop/:id', {
            id: '@id'
        });
    }]);