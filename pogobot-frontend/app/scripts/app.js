'use strict';

/**
 * @ngdoc overview
 * @name pogobotFrontendApp
 * @description
 * # pogobotFrontendApp
 *
 * Main module of the application.
 */
angular
    .module('pogobotFrontendApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute'
])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                controllerAs: 'main'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl',
                controllerAs: 'about'
            })
            .when('/access_token=:accessToken', {
                template: '',
                controller: function ($location, $rootScope) {
                    var hash = $location.path().substr(1);

                    var splitted = hash.split('&');
                    var params = {};

                    for (var i = 0; i < splitted.length; i++) {
                        var param = splitted[i].split('=');
                        var key = param[0];
                        var value = param[1];
                        params[key] = value;
                        $rootScope.accesstoken = params;
                    }
                    $location.path('/about');
                }
            })
            .otherwise({
                redirectTo: '/'
            });
    });