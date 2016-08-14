'use strict';

angular.module('pogobotFrontendApp')
    .factory('authHttpResponseInterceptor', ['$q', 'Login', '$location', 'toaster', function ($q, Login, $location, toaster) {
        var errorServerDown = false;
        return {
            response: function (response) {
                return response || $q.when(response);
            },
            responseError: function (rejection) {
                if (rejection.status === -1) {
                    if (!errorServerDown) {
                        errorServerDown = true;
                        toaster.pop({
                            type: 'error',
                            title: 'Connection Error',
                            body: 'Server Down, connection refused',
                            onHideCallback: function () {
                                errorServerDown = false;
                            }
                        });
                        $location.path('/');
                        Login.deleteCookies();
                    }
                } else
                if (rejection.status === 401) {
                    console.log('asdasdasd');
                    toaster.pop('error', 'Unauthorized Error', 'Errore di autenticazione o sessione scaduta. Effettuare nuovamente il login');
                    $location.path('/');
                    Login.deleteCookies();
                }
                return $q.reject(rejection);
            }
        };
    }]);