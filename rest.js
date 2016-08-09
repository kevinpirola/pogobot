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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // set the port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/login')
	.post((req, res) => {
		res.send(req);
	});

app.use('/api', router);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
	switch(line){
		case 'stop':
			gracefulShutdown();
		break;
	}
});

function gracefulShutdown(){
	server.close(function() {
		console.log('[PogoBot] Closed out remaining connections.');
		process.exit();
	});

	setTimeout(function() {
		console.error('[PogoBot] Closing connections timeouted, forcefully shutting down');
		process.exit();
	}, 10*1000);
}

// START SERVER
var server = app.listen(port);
console.log('[PogoBot] Server started on port: ' + port);
