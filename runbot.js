const pogobuf = require('pogobuf'),
      POGOProts = require('node-pogo-protos'),
      bluebird = require('bluebird'),
      Long = require('long');

const lat = 45.510798,
      lon = 12.234108;

const pokemonList = require('./data/pokemon.json');

function alphabetic(a, b){
	var na = pokemonList[a.pokemon_id].name;
	var nb = pokemonList[b.pokemon_id].name;
	if(na < nb) return -1;
	if(na > nb) return 1;
	return 0;
}

function cp(a, b){
	if(a.cp > b.cp) return -1;
	if(a.cp < b.cp) return 1;
	return 0;
}

function iv(a, b){
	var tota = a.individual_attack + a.individual_defense + a.individual_stamina;
	var totb = b.individual_attack + b.individual_defense + b.individual_stamina;

	if(tota > totb) return -1;
	if(tota < totb) return 1;
	return 0;
}

function number(a, b){
	if(a.pokemon_id < b.pokemon_id) return -1;
	if(a.pokemon_id > b.pokemon_id) return 1;
	return 0;
}

function printData(data){
	var atk = data.individual_attack;
	var dfs = data.individual_defense;
	var stm = data.individual_stamina;

	console.log('+--------------------------');
	console.log('POKEMON: ' + pokemonList[data.pokemon_id].name);
	console.log('CP: ' + data.cp);
	console.log('Attack: ' + atk);
	console.log('Defense: ' + dfs);
	console.log('Stamina: ' + stm);

	var IV = (atk + dfs + stm)/0.45;
	console.log('IV: ' + IV + '%');
	console.log('');
}

var argv = require('minimist')(process.argv.slice(2));

if(!argv.u){
	console.log('You should specify a username using: -u <yourUsername>');
	process.exit(1);
}
if(!argv.p){
	console.log('You should specify a password using: -p <yourPassword>');
	process.exit(1);
}
var login, loginMethod;
if(argv.a){
	if(argv.a === 'ptc'){
		login = new pogobuf.PTCLogin();
		loginMethod = 'ptc';
	} else if(argv.a === 'google'){
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
if(o){
	if(o === 'ab' || o === 'alphabetic'){
		order = alphabetic;
	} else if(o === 'cp'){
		order = cp;
	} else if(o === 'iv' || o === 'IV'){
		order = iv;
	} else if(o === 'n' || o === 'number'){
		order = number;
	} else {
		console.log('Order method not supported');
		process.exit(2);
	}
	
}
var pkmns = [];

var client = new pogobuf.Client();
login.login(argv.u, argv.p)
.then(token => {
    client.setAuthInfo(loginMethod, token);
    client.setPosition(lat, lon);
    return client.init();
}).then(() => {
    console.log('login successful');
    // Make some API calls!
    return client.getInventory(0);
}, (err)=>{console.log(err);}).then(inventory => {
	inventory.inventory_delta.inventory_items.forEach((item) =>{ 
	var data = item.inventory_item_data.pokemon_data;
		if(data!==null && !data.is_egg){
			pkmns.push(data);
		}
	});
	pkmns.sort(order);
	pkmns.forEach((pk)=>{
		printData(pk);
	});
/*try{
	setInterval(()=>{
		var cellIDs = pogobuf.Utils.getCellIDs(lat,lon);
		return bluebird.resolve(client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0))).then(mapObjects => {return mapObjects.map_cells;
}).each(cell => {
	console.log(cell.s2_cell_id.toString());
	console.log('Has ' + cell.catchable_pokemons.length + ' catchable Pokemon');
	return bluebird.resolve(cell.catchable_pokemons).each(catchablePokemon=>{
		console.log(' - A ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id));
	});
	});
	}, 10*1000);
} catch(e){
	console.log(e);
}*/
    // Use the returned data
});
