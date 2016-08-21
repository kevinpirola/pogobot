'use strict';

angular.module('pogobotFrontendApp')
    .factory('Gym', ['$resource', function ($resource) {
        return $resource('http://localhost:8080/api/gym');
    }]);