'use strict';

/**
 * @ngdoc function
 * @name pogobotFrontendApp.controller:GymsCtrl
 * @description
 * # GymsCtrl
 * Controller of the pogobotFrontendApp
 */
angular.module('pogobotFrontendApp')
    .controller('GymsCtrl', ['Gym', function (Gym) {

        var self = this;
        self.gyms = [];
	self.distribution = [{class: 'blue-bar'}, {class: 'red-bar'}, {class: 'yellow-bar'}];

        Gym.get(null, function (res) {
            self.gyms = res.data;
	    
	    self.distribution[0].value = 0;
	    self.distribution[1].value = 0;
	    self.distribution[2].value = 0;

	    angular.forEach(self.gyms, function(value, key){
		if(value.GD_OWNER_TEAM === 1){
		    self.distribution[0].value += (1 / self.gyms.length) * 100;	
		} else if (value.GD_OWNER_TEAM === 2) {
		    self.distribution[1].value += (1 / self.gyms.length) * 100;	
		} else {
		    self.distribution[2].value += (1 / self.gyms.length) * 100;	
		}
	    });
console.log(self.distribution);
        });

    }]);
