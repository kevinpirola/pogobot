module.exports = {
    getGyms: function(lat, lon, client, pogobuf){
        var cellIDs = pogobuf.Utils.getCellIDs(lat, lon);
		return client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0))
        .then(mapObjects => {
		  client.batchStart();

		  mapObjects.map_cells.map(cell => cell.forts)
		      .reduce((a, b) => a.concat(b))
		      .filter(fort => fort.type === 0)
		      .forEach(fort => client.getGymDetails(fort.id, fort.latitude, fort.longitude));

		  return client.batchCall();
	   })   
    }
}
