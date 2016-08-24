'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('MainCtrl', ['$window', '$http', 'Login', 'Pokemon', '$location', function ($window, $http, Login, Pokemon, $location) {

        var self = this;

        self.isAuth = Login.getToken();
        self.loginType = Login.getLoginType();
        self.pkmns = [];
        self.order = 'cp';

        self.login = function () {
            $http.post($location.protocol() + '://' + $location.host() + ':8080/api/login', {
                user: {
                    username: self.username,
                    password: self.password
                },
                loginType: (self.googleLogin) ? 'google' : 'ptc'
            }, {
                dataType: 'json'
            }).then(function (res) {
                var token = res.data.token;
                Login.setToken(token);
                self.isAuth = token;
                self.loginType = res.data.loginType || (self.googleLogin) ? 'google' : 'ptc';
                self.order = res.data.order || 'cp';
            }).catch(function (err) {
                console.log(err);
                Login.deleteCookies();
            });
        };

        self.logout = function () {
            Login.deleteCookies();
            self.isAuth = null;
            self.loginType = null;
        };

        self.getPokemon = function () {
            Pokemon.getPkmn({
                token: self.isAuth,
                lt: self.loginType || 'ptc',
                order: self.order || 'iv'
            }, function (data) {
                self.pkmns = data.data;
            });
        };

    }])
    .filter('formatpkmn', function () {
        return function (input) {
            var replaced = input.replace('. ', '-');
            return (replaced === 'nidoran♀' ? 'nidoranf' : (replaced === 'nidoran♂' ? 'nidoranm' : replaced));
        };
    });