const pogobuf = require('pogobuf');

var login = new pogobuf.PTCLogin(),
    client = new pogobuf.Client();
login.login('username925363', 'password')
.then(token => {
    client.setAuthInfo('ptc', token);
    client.setPosition(45.510798, 12.234108);
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
    // Use the returned data
});
