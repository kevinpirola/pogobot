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
const pokemonList = require('./res/pokemon.json');
//const sqlite = require('sqlite3').verbose();
//const db = new sqlite.Database('pogobot.db');
const db = require('./src/database.js');

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
    console.log('[PogoBot].[ER_0001] You should specify a username using: -u <yourUsername>');
    process.exit(1);
}
if (!argv.p) {
    console.log('[PogoBot].[ER_0002] You should specify a password using: -p <yourPassword>');
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
        console.log('[PogoBot].[ER_0003] - You specified an invalid login method. Current valid method are ptc or google');
    }
} else {
    console.log('[PogoBot] - No login method specified, using PTC as default');
    login = new pogobuf.PTCLogin();
    loginMethod = 'ptc';
}
//////////////////////////

//////// DATABASE ////////

/*function insertGymIfNew(gym) {
    db.get('SELECT * FROM GYMS WHERE G_ID = $id LIMIT 1', {
        $id: gym.gym_state.fort_data.id
    }, function (err, row) {
        if (!err) {
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
        } else {
            console.log('[PogoBot].[ER_0004] - Error while checking if gym exists: ' + err);
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
    }, function (err) {
        console.log('[PogoBot].[ER_0005] - Error while inserting new gym data: ' + err);
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

function getGymAndStatus(id, callback) {
    db.get('SELECT * FROM GYM_DATA JOIN GYMS ON G_ID = GD_ID_GYM JOIN LEVELS ON GD_LEVEL = L_ID WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1', {
        $id: id
    }, callback);
}

function isGymGrowing(id, callback) {
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

function insertOrUpdatePkmn(pkmn, callback) {
    db.run('INSERT INTO POKEMONS (P_ID, P_PKMN_ID, P_CP, P_STAMINA, P_STAMINA_MAX, P_ID_MOVE_1, P_ID_MOVE_2, P_OWNER_NAME, P_HEIGHT, P_WEIGHT, P_IND_ATK, P_IND_DEF, P_IND_STM, P_CP_MULTIPLIER, P_UPGRADES, P_NICKNAME) VALUES ($id, $pkmn_id, $cp, $stm, $stm_max, $mv1, $mv2, $owner_name, $height, $weight, $ind_atk, $ind_def, $ind_stm, $cp_multiplier, $upgrades, $nickname)', {
        $id: pkmn.id,
        $pkmn_id: pkmn.pokemon_id,
        $cp: pkmn.cp,
        $stm: pkmn.pokemon_stamina,
        $stm_max: pkmn.pokemon_stamina_max,
        $mv1: pkmn.move1,
        $mv2: pkmn.move2,
        $owner_name: pkmn.owner,
        $height: pkmn.height_m,
        $weight: pkmn.weight_kg,
        $ind_atk: pkmn.individual_attack,
        $ind_def: pkmn.individual_defense,
        $ind_stm: pkmn.individual_stamina,
        $cp_multiplier: pkmn.cp_multiplier,
        $upgrades: pkmn.number_upgrades,
        $nickname: pkmn.nickname
    }, callback);
}*/

//////////////////////////

var us;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
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
            console.log('[PogoBot].[ER_0006] - Error while login ' + req.body.user.username + ': ' + err);
            res.status(401).send('Error while login, retry');
        }).then(() => {
            res.status(200).json({
                message: 'Login Successful',
                token: us.getToken()
            });
        }, (err) => {
            console.log('[PogoBot].[ER_0007] - Failed client init: ' + err);
            res.status(401).json({
                message: 'Unable to login'
            });
        });
    });

router.route('/user/:token/:lt/pkmns')
    .get((req, res) => {
        var client = new pogobuf.Client();
        client.setAuthInfo(req.params.lt, req.params.token);
        client.init().then(() => {
            return client.getInventory(0);
        }, (err) => {
            console.log('[PogoBot].[ER_0000] - Unknown error: ' + err);
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
            console.log('[PogoBot].[ER_0008] - Unable to fetch the inventory: ' + err);
            res.status(401).json({
                message: 'Unable to fetch the inventory'
            });
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
        db.getFatGyms((err, gyms) => {
            if (!err) {
                res.status(200).json({
                    data: gyms //filterGyms()
                });
            } else {
                console.log('[PogoBot].[ER_0009].[Database] - Error while fetching the list: ' + err);
                res.status(500).json({
                    message: 'Error while fetching the gym list'
                });
            }
        });
    });

router.route('/gym/:id')
    .get((req, res) => {
        db.getGymAndStatus(req.params.id, function (err, data) {
            if (!err) {
                console.log(gyms[req.params.id].gym_state.memberships);
                res.status(200).json({
                    data: data //gyms[req.params.id]
                });
            } else {
                console.log('[PogoBot].[ER_0010].[Database] - Error while fetching the gym: ' + err);
                res.status(500).json({
                    message: 'Error while fetching the gym ' + err
                });
            }
        });
    });

router.route('/gym/:id/pokemon')
    .get((req, res) => {
        db.getPokemons(req.params.id, function (err, data) {
            if (!err) {
                res.status(200).json({
                    data: data
                });
            } else {
                console.log('[PogoBot].[ER_0023].[Database] - Error while fetching pokemons for the gym. ' + err);
                res.status(500).json({
                    message: 'Error while fetching the pokemons ' + err
                });
            }
        });
    });

router.route('/gym/:id/growing')
    .get((req, res) => {
        db.isGymGrowing(req.params.id, function (err, data) {
            if (!err) {
                res.status(200).json({
                    growing: data.GROWING
                });
            } else {
                console.log('[PogoBot].[ER_0011].[Database] - Error while calculating growth: ' + err);
                res.status(500).json({
                    message: 'Error while calculating if growing'
                });
            }
        });
    });

router.route('/level/:id')
    .get((req, res) => {
        db.getLevel(req.params.id, function (err, data) {
            if (!err) {
                res.status(200).json({
                    data: data
                });
            } else {
                console.log('[PogoBot].[ER_0012].[Database] - Error while fetching level data: ' + err);
                res.status(500).json({
                    message: 'Error while fetching level data'
                });
            }
        });
    });

function startGymsDaemon() {
    initClient().then(() => {
        gyms_loop();
    }, (err) => {
        console.log('[PogoBuf].[ER_0013].[GymsDaemon] - Error in initialization: ' + err);
    });
}

function initClient() {
    gymsClient = new pogobuf.Client();

    return login.login(argv.u, argv.p)
        .then(token => {
            console.log('[PogoBuf].[GymsDaemon] - Login Successful for ' + argv.u);
            gymsClient.setAuthInfo(loginMethod, token);
            gymsClient.setPosition(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon);
            return gymsClient.init();
        }, (err) => {
            console.log('[PogoBuf].[ER_0014].[GymsDaemon] - Error while login: ' + err);
        });
}

function gyms_loop() {
    console.log('[PogoBuf].[GymsDaemon] - Looping...');
    $gym.getGyms(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon, gymsClient, pogobuf).then((loopGyms) => {
        var timestamp = new Date().getTime();
        if (Array.isArray(loopGyms)) {
            loopGyms.forEach(function (gym) {
                gym.visit_timestamp = new Date().getTime();
                gyms[gym.gym_state.fort_data.id] = gym;
                // STORE IN DB //
                db.storeGymAndData(gym, timestamp);
                db.storeGymPokemons(gym, timestamp);
            });
        } else {
            loopGyms.visit_timestamp = new Date().getTime();
            gyms[loopGyms.gym_state.fort_data.id] = loopGyms;
            // STORE IN DB //
            db.storeGymAndData(loopGyms, timestamp);
            db.storeGymPokemons(loopGyms, timestamp);
        }

        var newGymsPathStep = (gymsPathStep + 1) % gymsPath.length;
        var promise = $move.move(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon, gymsPath[newGymsPathStep].lat, gymsPath[newGymsPathStep].lon, speed, gymsClient);
        gymsPathStep = newGymsPathStep;
        return promise;
    }).then(() => {
        gyms_loop();
    }).catch((err) => {
        console.log('[PogoBuf].[ER_0000].[GymsDaemon] - An error occurred or Token not valid, reinitializing daemon' + err);
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
    case 'populate-types':
        db.populateTypes('../res/types.json');
        break;
    case 'populate-species':
        db.populateSpecies('../res/pokemon.json');
        break;
    case 'reset-moves':
        db.resetMoves();
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