'use strict';

var TKNAME = 'POGOBOT-TOKEN';
var LGTYPE = 'POGOBOT-LOGIN-TYPE';

angular.module('pogobotFrontendApp').factory('Login', ['$cookies', function ($cookies) {
    var self = this;
    self.token = $cookies.get(TKNAME);
    self.ltype = $cookies.get(LGTYPE);
    return {

        setToken: function (tk) {
            self.token = tk;
            $cookies.put(TKNAME, tk);
        },

        getToken: function () {
            return self.token;
        },

        setLoginType: function (type) {
            self.ltype = type;
            $cookies.put(LGTYPE, type);
        },

        getLoginType: function () {
            return self.ltype;
        },

        deleteCookies: function () {
            $cookies.remove(TKNAME);
            self.token = null;
        }
    };
}]);