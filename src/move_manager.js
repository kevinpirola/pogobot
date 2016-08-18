module.exports = {
    MOVE_TIMEOUT: 1000, //milliseconds

    getSteps: function(distanceM, speedKmh){
        return Math.floor(((distanceM * 18) / (speedKmh * 5)) / (this.MOVE_TIMEOUT / 1000));
    },

    //Thanks to b-h- from StackOverflow	
    measure: function (lat1, lon1, lat2, lon2){  //generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
    },

    move: function(startLat, startLon, endLat, endLon, speed, client, Q){
        var deferred = Q.defer();

        var distance = this.measure(startLat, startLon, endLat, endLon);
        var steps = this.getSteps(distance, speed);

        var dLat = (endLat - startLat) / steps;
        var dLon = (endLon - startLon) / steps;

        this.move_rec(startLat, startLon, dLat, dLon, steps, deferred, client);

        return deferred.promise.then(() => {
            client.setPosition(endLat, endLon);
            return client.playerUpdate();
        });
    },

    move_rec: function(x, y, dx, dy, steps, deferred, client){
        console.log('Steps to move: ' + steps);
        if(steps <= 0){
            deferred.resolve(undefined);
        } else {
            x += dx;
            y += dy;
            client.setPosition(x, y);
            client.playerUpdate();
            var self = this;
            setTimeout(function(){ self.move_rec(x, y, dx, dy, steps - 1, deferred, client); }, this.MOVE_TIMEOUT);
        }
    }
}