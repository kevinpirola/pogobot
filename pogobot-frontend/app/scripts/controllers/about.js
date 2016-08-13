'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('AboutCtrl', ['$rootScope', function ($rootScope) {
        this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

        this.tok = $rootScope.accesstoken;
  }]);