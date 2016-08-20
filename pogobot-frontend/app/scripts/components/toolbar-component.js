'use strict';

angular.module('pogobotFrontendApp')
    .component('toolbar', {
        templateUrl: '/scripts/components/toolbar-component.html',
        controller: ['$mdSidenav', function ($mdSidenav) {
            var self = this;
            self.toggleSidenav = function () {
                $mdSidenav('sidenav-left').open();
            };
        }]
    });