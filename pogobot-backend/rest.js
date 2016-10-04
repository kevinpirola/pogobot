#!/usr/local/bin/node

/**
 * This class is used to run a set of RESTful API
 *
 * @author Gianmarco Laggia
 * @since 09/08/2016
 *
 */
const path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var readline = require('readline');
const pogobuf = require('pogobuf');
const pokemonList = require(path.join(__dirname, 'res/pokemon.json'));
const CONFIG = require(path.join(__dirname, 'conf/config.json'));
const db = require(path.join(__dirname, 'src/database.js'));

var app = express();

db.initialize(startGymsDaemon);

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
var gymsPath = $jsonfile.readFileSync(path.join(__dirname, 'conf/path.json'));
var gymsPathStep = 0;
const $move = require(path.join(__dirname, 'src/move_manager.js'));
const $gym = require(path.join(__dirname, 'src/gym.js'));
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

router.route('/levels')
    .get((req, res) => {
        db.getLevel(function (err, data) {
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

    return login.login(CONFIG.username, CONFIG.password)
        .then(token => {
            console.log('[PogoBuf].[GymsDaemon] - Login Successful for ' + CONFIG.username);
            if (CONFIG.proxy) {
                console.log('[PogoBuf].[GymsDaemon] - Using Proxy');
                gymsClient.setProxy(CONFIG.proxy);
            }
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
		        db.storeGymDataAndPokemons(gym, timestamp);
            });
        } else {
            loopGyms.visit_timestamp = new Date().getTime();
            gyms[loopGyms.gym_state.fort_data.id] = loopGyms;
            // STORE IN DB //
	        db.storeGymDataAndPokemons(loopGyms, timestamp);
        }

        var newGymsPathStep = (gymsPathStep + 1) % gymsPath.length;
        var promise = $move.move(gymsPath[gymsPathStep].lat, gymsPath[gymsPathStep].lon, gymsPath[newGymsPathStep].lat, gymsPath[newGymsPathStep].lon, speed, gymsClient);
        gymsPathStep = newGymsPathStep;
        return promise;
    }).then(() => {
        gyms_loop(); 
        return null;
    }).catch((err) => {
        console.log('[PogoBuf].[ER_0000].[GymsDaemon] - An error occurred or Token not valid, reinitializing daemon' + err);
        startGymsDaemon();
    });
}

//startGymsDaemon();

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
        db.resetMoves(function () {});
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
