const pogobuf = require('pogobuf'),
    POGOProts = require('node-pogo-protos'),
    bluebird = require('bluebird'),
    Long = require('long');

/*const lat = 45.510798,
      lon = 12.234108;*/

const pokemonList = require('./data/pokemon.json');

const endLat = 45.476693;
const endLon = 12.216170;
const startLat = 45.477233;
const startLon = 12.205493;

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

function printData(data) {
    var atk = data.individual_attack;
    var dfs = data.individual_defense;
    var stm = data.individual_stamina;

    console.log('+--------------------------');
    console.log('POKEMON: ' + pokemonList[data.pokemon_id].name);
    console.log('CP: ' + data.cp);
    console.log('Attack: ' + atk);
    console.log('Defense: ' + dfs);
    console.log('Stamina: ' + stm);

    var IV = (atk + dfs + stm) / 0.45;
    console.log('IV: ' + IV + '%');
    console.log('');
}

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
        console.log('ERROR, you specified an invalid login method. Current valid method are ptc or google');
    }
} else {
    console.log('No login method specified, using PTC as default');
    login = new pogobuf.PTCLogin();
    loginMethod = 'ptc';
}

var order = cp;
var o = argv.o;
if (o) {
    if (o === 'ab' || o === 'alphabetic') {
        order = alphabetic;
    } else if (o === 'cp') {
        order = cp;
    } else if (o === 'iv' || o === 'IV') {
        order = iv;
    } else if (o === 'n' || o === 'number') {
        order = number;
    } else {
        console.log('Order method not supported');
        process.exit(2);
    }

}

var loc = null;
var lat, lon;
if (argv.l) {
    var split = argv.l.split(', ');
    if (split.length !== 2) {
        split = argv.l.split(' ');
    }
    if (split.length !== 2) {
        console.log('ERROR, coord format not valid. A valid format is: "45.000, 12.0000" or "45.0000 12.0000"');
        process.exit(3);
    }
    lat = parseFloat(split[0]);
    lon = parseFloat(split[1]);
}
var pkmns = [];

const $moveManager = require('./src/move_manager.js');
const $gym = require('./src/gym.js');

var client = new pogobuf.Client();
login.login(argv.u, argv.p)
    .then(token => {
        client.setAuthInfo(loginMethod, token);
        if (lat && lon) {
            //client.setPosition(lat, lon);
        }
	client.setPosition(startLat, startLon);
        return client.init();
    }).then(() => {
		return $gym.getGyms(startLat, startLon, client, pogobuf);
	}).then(gyms => {
		console.log(gyms);
		/*var data = gyms[0].gym_state.fort_data;
		var lat = data.latitude;
		var lon = data.longitude;
		var id = data.id;
		return client.getGymDetails(id, lat, lon);
	}).then(res => {
		res.gym_state.memberships.forEach(m => {
		//	console.log(m);
		console.log('-----------------------------------' + pokemonList[m.pokemon_data.pokemon_id].name + ' CP: ' + m.pokemon_data.cp + ' TR: ' + m.trainer_public_profile.name);
	});

return client.getGymDetails( '99138cf0baec4a7888df12e3ed9d2e09.16', 45.478554, 12.202518);

}).then(res => {

console.log(res);
        res.gym_state.memberships.forEach(m => {
          //      console.log(m);
                console.log('-----------------------------------' + pokemonList[m.pokemon_data.pokemon_id].name + ' CP: ' + m.pokemon_data.cp);
        });
},err=>{
	console.log(err);*/
	

        return $moveManager.move(startLat, startLon, endLat, endLon, 100, client)
    }).then(() => {
        return $gym.getGyms(endLat, endLon, client, pogobuf);
    }).then(gyms => {
        console.log(gyms);
	});


        // Make some API calls!
        /*return client.getInventory(0);
    }, (err) => {
        console.log(err);
    }).then(inventory => {
        inventory.inventory_delta.inventory_items.forEach((item) => {
            var data = item.inventory_item_data.pokemon_data;
            if (data !== null && !data.is_egg) {
                pkmns.push(data);
            }
        });
        pkmns.sort(order);
        pkmns.forEach((pk) => {
            printData(pk);
        });
    });*/
