const Q = require('q');

const MOVE_TIMEOUT = 1000;

var status = true;
var error = undefined;

function getSteps(distanceM, speedKmh){
	return Math.floor(((distanceM * 18) / (speedKmh * 5)) / (MOVE_TIMEOUT / 1000));
}

//Thanks to b-h- from StackOverflow 
function measure(lat1, lon1, lat2, lon2){  //generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
}

function move_rec(x, y, dx, dy, steps, deferred, client){
        console.log('Steps to move: ' + steps);
        if(steps <= 0){
            if(status){
                deferred.resolve(undefined);
            } else {
                status = true;
                deferred.reject(error);
            }
        } else {
            x += dx;
            y += dy;
            client.setPosition(x, y);
            client.playerUpdate().catch((err) => { 
                status = false;
                error = err;
            });
            setTimeout(function(){ move_rec(x, y, dx, dy, steps - 1, deferred, client); }, MOVE_TIMEOUT);
        }
}

module.exports = {
    move: function(startLat, startLon, endLat, endLon, speed, client){
        var deferred = Q.defer();

        var distance = measure(startLat, startLon, endLat, endLon);
        var steps = getSteps(distance, speed);

        var dLat = (endLat - startLat) / steps;
        var dLon = (endLon - startLon) / steps;

        move_rec(startLat, startLon, dLat, dLon, steps, deferred, client);

        return deferred.promise.then(() => {
            client.setPosition(endLat, endLon);
            return client.playerUpdate();
        });
    }
}
