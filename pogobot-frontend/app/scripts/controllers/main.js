'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('MainCtrl', ['$window', '$http', 'Login', 'Pokemon', function ($window, $http, Login, Pokemon) {

        var self = this;
        this.awesomeThings = [
          'HTML5 Boilerplate',
          'AngularJS',
          'Karma'
        ];

        self.isAuth = Login.getToken();
        self.loginType = Login.getLoginType();
        self.pkmns = [];

        self.login = function () {
            $http.post('http://kevinpirola.ddns.net:8080/api/login', {
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
                self.order = res.data.order;
            });
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