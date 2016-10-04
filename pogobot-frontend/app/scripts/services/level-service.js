'use strict';

angular.module('pogobotFrontendApp')
    .factory('Level', ['$http', '$location', '$cookies', function ($http, $location, $cookies) {
	var self = {};
	var levels = {};

	if($cookies.getObject('LEVELS')){
		levels = $cookies.getObject('LEVELS');
	} else {
	    $http.get($location.protocol() + '://' + $location.host() + ':8080/api/levels').success(function(res){ 
		levels = res.data; 
		$cookies.putObject('LEVELS', levels);
	    });
	}

	self.get = function(id){
		return searchLevel(id); 
	};
	
	var searchLevel = function(id){
		for(var i in levels){
			if(levels[i].L_ID === id){
				return levels[i];
			}
		}
		return {};	
	};

	return self;
    }]);
