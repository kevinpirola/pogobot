const pogobuf = require('pogobuf'),
      POGOProts = require('node-pogo-protos'),
      bluebird = require('bluebird'),
      Long = require('long');

const lat = 45.510798,
      lon = 12.234108;

var login = new pogobuf.PTCLogin(),
    client = new pogobuf.Client();
login.login('username925363', 'password')
.then(token => {
    client.setAuthInfo('ptc', token);
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
			console.log('+--------------------------');
			console.log('POKEMON: ' + data.pokemon_id);
			console.log('Attack: ' + data.individual_attack);
			console.log('Defense: ' + data.individual_defense);
			console.log('Stamina: ' + data.individual_stamina);
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
