#!/usr/local/bin/node

/**
 * This class is used to run a set of RESTful API
 *
 * @author Gianmarco Laggia
 * @since 09/08/2016
 *
 */
var express = require('express');
var bodyParser = require('body-parser');
var readline = require('readline');
const pogobuf = require('pogobuf');
const pokemonList = require('./data/pokemon.json');
const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('pogobot.db');

var app = express();

////////// USER //////////

function User(u, p) {
    this.username = u;
    this.password = p;
    this.loginClass = null;
    this.client = new pogobuf.Client();
    this.token = null;
}

User.prototype.login = function (type) {

    if (!this.loginClass) {
        if (type === 'google') {
            this.loginClass = new pogobuf.GoogleLogin();
        } else if (type === 'ptc') {
            this.loginClass = new pogobuf.PTCLogin();
        } else {
            console.log('errore');
        }
    }

    return this.loginClass.login(this.username, this.password);
}

User.prototype.getClient = function () {
    return this.client;
}

User.prototype.setToken = function (t) {
    this.token = t;
}

User.prototype.getToken = function () {
    return this.token;
}

//////////////////////////

/////// PARAMETERS ///////
var argv = require('minimist')(process.argv.slice(2));

if (!argv.u) {
    console.log('You should specify a username using: -u <yourUsername>');
    process.exit(1);
}
if (!argv.p) {
    console.log('You should specify a password using: -p <yourPassword>');
    process.exit(1);
}
var login, loginMethod;
if (argv.a) {
    if (argv.a === 'ptc') {
        login = new pogobuf.PTCLogin();
        loginMethod = 'ptc';
    } else if (argv.a === 'google') {
        login = new pogobuf.GoogleLogin();
        loginMethod = 'google';
    } else {
        console.log('[PogoBot] - ERROR, you specified an invalid login method. Current valid method are ptc or google');
    }
} else {
    console.log('[PogoBot] - No login method specified, using PTC as default');
    login = new pogobuf.PTCLogin();
    loginMethod = 'ptc';
}
//////////////////////////

//////// DATABASE ////////

function insertGymIfNew(gym) {
    db.get('SELECT * FROM GYMS WHERE G_ID = $id LIMIT 1', {
        $id: gym.gym_state.fort_data.id
    }, function (err, row) {
        if (!row) {
            console.log('[PogoBot].[Database] - Added a new gym to the list');
            db.run('INSERT INTO GYMS (G_ID, G_LAT, G_LON, G_NAME, G_IMG) VALUES ($id, $lat, $lon, $name, $img)', {
                $id: gym.gym_state.fort_data.id,
                $lat: gym.gym_state.fort_data.latitude,
                $lon: gym.gym_state.fort_data.longitude,
                $name: gym.name,
                $img: gym.urls[0]
            });
        }
    });
}

function insertNewDataUpdate(gym) {
    db.run('INSERT INTO GYM_DATA (GD_ID_GYM, GD_TIMESTAMP, GD_POINTS, GD_LEVEL, GD_OWNER_TEAM, GD_IS_IN_BATTLE) VALUES ($id, $time, $points, (SELECT L_ID FROM LEVELS WHERE $points >= L_MIN_POINTS ORDER BY L_MIN_POINTS DESC LIMIT 1), $owner, $inbattle)', {
        $id: gym.gym_state.fort_data.id,
        $time: new Date().getTime(),
        $points: gym.gym_state.fort_data.gym_points,
        $owner: gym.gym_state.fort_data.owned_by_team,
        $inbattle: gym.gym_state.fort_data.is_in_battle
    });
}

function storeGymAndData(gym) {
    db.serialize(function () {
        insertGymIfNew(gym);
        insertNewDataUpdate(gym);
    });
}

function getGyms(callback) {
    db.all(' SELECT * FROM GYMS)', callback);
}

function getFatGyms(callback) {
    db.all('SELECT * FROM GYMS ' +
        'JOIN GYM_DATA ON G_ID = GD_ID_GYM AND GD_TIMESTAMP = (SELECT MAX(GD_TIMESTAMP) FROM GYM_DATA WHERE GD_ID_GYM = G_ID) ', callback);
}

function getGym(id, callback) {
    db.get('SELECT * FROM GYMS WHERE G_ID = $id', {
        $id: id
    }, callback);
}

function getGymData(id, callback) {
    db.get('SELECT * FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1', {
        $id: id
    }, callback);
}

function isGymGrowing(id, callback) {
    //'SECOND_LAST AS (SELECT DISTINCT GD_POINTS AS PREVIOUS_POINTS FROM GYM_DATA WHERE GD_ID_GYM = $id AND GD_TIMESTAMP < (SELECT MAX(GD_TIMESTAMP) FROM GYM_DATA WHERE GD_ID_GYM = $id) ORDER BY GD_TIMESTAMP DESC LIMIT 1)' +
    db.get(
        'WITH LAST AS (SELECT DISTINCT GD_POINTS AS ACTUAL_POINTS FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1),' +
        'SECOND_LAST AS (SELECT DISTINCT GD_POINTS AS PREVIOUS_POINTS FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1 OFFSET 1)' +
        'SELECT CASE WHEN ACTUAL_POINTS > PREVIOUS_POINTS THEN 1 WHEN ACTUAL_POINTS < PREVIOUS_POINTS THEN 2 ELSE 0 END AS GROWING FROM LAST LEFT JOIN SECOND_LAST', {
            $id: id
        }, callback);
}

function getLevel(lvl, callback) {
    db.get('SELECT * FROM LEVELS WHERE L_ID = $lvl', {
        $lvl: lvl
    }, callback);
}

//////////////////////////

var us;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

var port = process.env.PORT || 8080; // set the port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

/**
 * REST SERVICE TO OBTAIN A TOKEN FROM GOOGLE LOGIN SERVICE
 */
router.route('/login')
    .post((req, res) => {
        console.log('[PogoBot] Received login request for user: ' + req.body.user.username);
        us = new User(req.body.user.username, req.body.user.password);
        us.login(req.body.loginType).then(token => {
            var client = us.getClient();
            us.setToken(token);
            client.setAuthInfo(req.body.loginType, token);
            return client.init();
        }, (err) => {
            console.log('[PogoBuf] - ' + err);
            res.status(401).send('Error while login, retry');
        }).then(() => {
            res.status(200).json({
                message: 'Login Successful',
                token: us.getToken()
            });
        }, (err) => {
            console.log('[PogoBuf] - ' + err);
            res.status(401).json({
                message: 'Unable to login'
            });
        })
    });

router.route('/user/:token/:lt/pkmns')
    .get((req, res) => {
        var client = new pogobuf.Client();
        client.setAuthInfo(req.params.lt, req.params.token);
        client.init().then(() => {
            return client.getInventory(0);
        }, (err) => {
            console.log('[PogoBuf] - ' + err);
            res.status(401).json({
                message: 'Invalid Token or generic error'
            });
        }).then((inventory) => {
            var pkmns = [];
            inventory.inventory_delta.inventory_items.forEach((item) => {
                var data = item.inventory_item_data.pokemon_data;
                if (data !== null && !data.is_egg) {
                    var atk = data.individual_attack;
                    var dfs = data.individual_defense;
                    var stm = data.individual_stamina;

                    var IV = (atk + dfs + stm) / 0.45;
                    data.pokemon_name = pokemonList[data.pokemon_id].name;
                    data.iv = IV;
                    pkmns.push(data);
                }
            });
            res.status(200).json({
                message: 'List retreived successfully',
                data: pkmns
            });
        }, err => {

        });
    });

/**************** GYM *****************/

var gyms = {};
var $jsonfile = require('jsonfile');
var gymsPath = $jsonfile.readFileSync('./res/path.json');
var gymsPathStep = 0;
const $move = require('./src/move_manager.js');
const $gym = require('./src/gym.js');
var gymsClient;
var speed = 100;

router.route('/gym')
    .get((req, res) => {
        getFatGyms((err, gyms) => {
            if (!err) {
                res.status(200).json({
                    data: gyms //filterGyms()
                });
            } else {
                console.log('[PogoBot].[Database] - Error: ' + err);
                res.status(500).json({
                    message: 'Error while fetching the gym list'
                });
            }
        });
    });

router.route('/gym/:id')
    .get((req, res) => {
        res.status(200).json({
            data: gyms[req.params.id]
        });
    });

router.route('/gym/:id/growing')
    .get((req, res) => {
        isGymGrowing(req.params.id, function (err, data) {
            if (!err) {
                res.status(200).json({
                    growing: data.GROWING
                });
            } else {
                console.log('[PogoBot].[Database] - Error: ' + err);
                res.status(500).json({
                    message: 'Error while calculating if growing'
                });
            }
        });
    });

router.route('/level/:id')
    .get((req, res) => {
        getLevel(req.params.id, function (err, data) {
            if (!err) {
                res.status(200).json({
                    data: data
                });
            } else {
                console.log('[PogoBot].[Database] - Error: ' + err);
                res.status(500).json({
                    message: 'Error while calculating if growing'
                });
            }
        });
    });

function filterGyms() {
    var result = [];

    for (i in gyms) {
        var gym = gyms[i];
        var obj = {};
        obj.id = gym.gym_state.fort_data.id;
        obj.name = gym.name;
        obj.points = gym.gym_state.fort_data.gym_points;
        obj.level = getLevelAndMax(obj.points).level;
        obj.level_max_points = getLevelAndMax(obj.points).max_points;
        obj.is_in_battle = gym.gym_state.fort_data.is_in_battle;
        obj.team = gym.gym_state.fort_data.owned_by_team;
        obj.lat = gym.gym_state.fort_data.latitude;
        obj.lon = gym.gym_state.fort_data.longitude;
        obj.visit_timestamp = gym.visit_timestamp;
        result.push(obj);
    }

    return result;
};

function getLevelAndMax(points) {
    var level = 1;
    var max = 2000;
    if (points >= 2000) {
        level = 2;
        max = 4000;
        if (points >= 4000) {
            level = 3;
            max = 8000;
            if (points >= 8000) {
                level = 4;
                max = 12000;
                if (points >= 12000) {
                    level = 5;
                    max = 16000;
                    if (points >= 16000) {
                        level = 6;
                        max = 20000;
                        if (points >= 20000) {
                            level = 7;
                            max = 30000;
                            if (points >= 30000) {
                                level = 8;
                                max = 40000;
                                if (points >= 40000) {
                                    level = 9;
                                    max = 50000;
                                    if (points >= 50000) {
                                        level = 10;
                                        max = 50000;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return {
        level: level,
        max_points: max
    };

};

function startGymsDaemon() {
    initClient().then(() => {
        gyms_loop();
    }, (err) => {
        console.log('[PogoBuf].[GymsDaemon] - Error in initialization: ' + err);
    });
}

function initClient() {
    //var login = new pogobuf.PTCLogin();
    gymsClient = new pogobuf.Client();

    return login.login(argv.u, argv.p)
        .then(token => {
            console.log('[PogoBuf].[GymsDaemon] - Login Successful for ' + argv.u);
            gymsClient.setAuthInfo(loginMethod, token);
            gymsClient.setPosition(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon);
            return gymsClient.init();
        }, (err) => {
            console.log('[PogoBuf].[GymsDaemon] - Error while login: ' + err);
        });
}

function gyms_loop() {
    console.log('[PogoBuf].[GymsDaemon] - Looping...');
    $gym.getGyms(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon, gymsClient, pogobuf).then((loopGyms) => {
        if (Array.isArray(loopGyms)) {
            loopGyms.forEach(function (gym) {
                gym.visit_timestamp = new Date().getTime();
                gyms[gym.gym_state.fort_data.id] = gym;
                // STORE IN DB //
                storeGymAndData(gym);
            });
        } else {
            loopGyms.visit_timestamp = new Date().getTime();
            gyms[loopGyms.gym_state.fort_data.id] = loopGyms;
            // STORE IN DB //
            storeGymAndData(loopGyms);
        }

        var newGymsPathStep = (gymsPathStep + 1) % gymsPath.length;
        var promise = $move.move(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon, gymsPath[newGymsPathStep].lat, gymsPath[newGymsPathStep].lon, speed, gymsClient);
        gymsPathStep = newGymsPathStep;
        return promise;
    }).then(() => {
        gyms_loop();
    }).catch((ecc) => {
        console.log('[PogoBuf].[GymsDaemon] - An error occurred or Token not valid, reinitializing daemon');
        startGymsDaemon();
    });
}

startGymsDaemon();

/****************END GYM ****************/

app.use('/api', router);

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function (line) {
    switch (line) {
    case 'stop':
        gracefulShutdown();
        break;
    }
});

function gracefulShutdown() {
    server.close(function () {
        console.log('[PogoBot] Closed out remaining connections.');
        db.close();
        process.exit();
    });

    setTimeout(function () {
        console.error('[PogoBot] Closing connections timeouted, forcefully shutting down');
        db.close();
        process.exit();
    }, 10 * 1000);
}

// START SERVER
var server = app.listen(port);
console.log('[PogoBot] Server started on port: ' + port);