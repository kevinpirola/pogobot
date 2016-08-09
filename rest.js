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

var us;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // set the port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({
        message: 'hooray! welcome to our api!'
    });
});

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
            res.send({
                message: 'Login Successful',
                token: us.getToken()
            });
        }, (err) => {
            res.status(401).json({
                message: 'Unable to login'
            });
        })
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