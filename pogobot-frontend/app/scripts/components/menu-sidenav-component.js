'use strict';

angular.module('pogobotFrontendApp')
    .component('menuSidenav', {
        templateUrl: '/scripts/components/menu-sidenav-component.html',
        controller: ['$mdSidenav', function ($mdSidenav) {
            var self = this;
            self.closeSidenav = function () {
                $mdSidenav('sidenav-left').close();
            };
        }]
    });