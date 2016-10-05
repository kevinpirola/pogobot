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
    'ngRoute',
    'toaster',
    'ui.router',
    'ngMaterial'
])
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                controllerAs: 'main'
            })
            .state('loops', {
                url: '/loops',
                templateUrl: 'views/loops.html',
                controller: 'LoopsCtrl',
                controllerAs: '$ctrl'
            })
            .state('gyms', {
                url: '/loops/:lid',
                templateUrl: 'views/gyms.html',
                controller: 'GymsCtrl',
                controllerAs: '$ctrl'
            })
            .state('details', {
                url: '/gym/:gid',
                templateUrl: 'views/gym-details.html',
                controller: 'GymDetailCtrl',
                controllerAs: '$ctrl'
            })
            .state('about', {
                url: '/about',
                templateUrl: 'views/about.html'
            });

    }])
    .config(['$mdIconProvider', function ($mdIconProvider) {
        $mdIconProvider.defaultIconSet('images/mdi.svg');
    }])
    .config(['$httpProvider', function ($httpProvider) {
        //Http Intercpetor to check auth failures for xhr requests
        $httpProvider.interceptors.push('authHttpResponseInterceptor');
    }]);