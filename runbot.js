const pogobuf = require('pogobuf'),
      POGOProts = require('node-pogo-protos'),
      bluebird = require('bluebird'),
      Long = require('long');

const lat = 45.510798,
      lon = 12.234108;

const pokemonList = require('./data/pokemon.json');

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
		if(data!==null){
			var atk = data.individual_attack;
			var dfs = data.individual_defense;
			var stm = data.individual_stamina;
			
			console.log('+--------------------------');
			console.log('POKEMON: ' + pokemonList[data.pokemon_id].name);
			console.log('Attack: ' + atk);
			console.log('Defense: ' + dfs);
			console.log('Stamina: ' + stm);
			
			var IV = (atk + dfs + stm)/0.45;
			console.log('IV: ' + IV + '%');	
			console.log('');
		}
		
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
