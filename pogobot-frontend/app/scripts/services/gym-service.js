'use strict';

angular.module('pogobotFrontendApp')
    .factory('Gym', ['$resource', '$location', function ($resource, $location) {
        return $resource($location.protocol() + '://' + $location.host() + ':8080/api/gym');
    }]);