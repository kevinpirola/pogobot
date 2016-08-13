'use strict';

angular.module('pogobotFrontendApp').factory('Login', [function () {
    var self = this;
    self.token = null;
    return {

        setToken: function (tk) {
            self.token = tk;
        },

        getToken: function () {
            return self.token;
        }
    };
}]);