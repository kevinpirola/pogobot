/**
 * This class is used to run a set of RESTful API
 *
 * @author Gianmarco Laggia
 * @since 09/08/2016
 *
 */
var express = require('express'); // call express
var app = express();
var bodyParser = require('body-parser');
var readline = require('readline');

////////////////////
const pogobuf = require('pogobuf');
const pokemonList = require('./data/pokemon.json');

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

/////////////

/** ORDER METHODS **/
function alphabetic(a, b) {
    var na = pokemonList[a.pokemon_id].name;
    var nb = pokemonList[b.pokemon_id].name;
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
}

function cp(a, b) {
    if (a.cp > b.cp) return -1;
    if (a.cp < b.cp) return 1;
    return 0;
}

function iv(a, b) {
    var tota = a.individual_attack + a.individual_defense + a.individual_stamina;
    var totb = b.individual_attack + b.individual_defense + b.individual_stamina;

    if (tota > totb) return -1;
    if (tota < totb) return 1;
    return 0;
}

function number(a, b) {
    if (a.pokemon_id < b.pokemon_id) return -1;
    if (a.pokemon_id > b.pokemon_id) return 1;
    return 0;
}

////////////////

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
            console.log(err);
            res.status(401).json({
                message: 'Unable to login'
            });
        })
    });

router.route('/user/:token/:lt/pkmns/order/:order')
    .get((req, res) => {
        var client = new pogobuf.Client();
        client.setAuthInfo(req.params.lt, req.params.token);
        client.init().then(() => {
            return client.getInventory(0);
        }, (err) => {
            console.log(err);
            res.status(500).json({
                message: 'Errored'
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

            var o = req.params.order;
            var order = iv;
            if (o) {
                if (o === 'ab' || o === 'alphabetic' || o === 'name') {
                    order = alphabetic;
                } else if (o === 'cp') {
                    order = cp;
                } else if (o === 'iv' || o === 'IV') {
                    order = iv;
                } else if (o === 'n' || o === 'number') {
                    order = number;
                }
            }

            pkmns.sort(order);
            res.status(200).json({
                message: 'List retreived successfully',
                data: pkmns
            });
        }, err => {

        });
    });

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
        process.exit();
    });

    setTimeout(function () {
        console.error('[PogoBot] Closing connections timeouted, forcefully shutting down');
        process.exit();
    }, 10 * 1000);
}

// START SERVER
var server = app.listen(port);
console.log('[PogoBot] Server started on port: ' + port);