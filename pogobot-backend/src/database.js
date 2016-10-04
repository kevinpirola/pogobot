const fs = require('fs');
const sqlite = require('sqlite3').verbose();
const path = require('path');
var db = null;

function initDatabase(callback) {
    console.log('[PogoBot].[Database] - Initializing a new database');
    var sql = fs.readFileSync(path.join(__dirname, '../db/sqlinit.txt')).toString();
    db.serialize(function () {
        db.exec(sql, function (err) {
            if (err) {
                console.log('[PogoBot].[Database] - Error while initializing the db');
            }
        });
        defaultTypes('../res/types.json');
        defaultSpecies('../res/pokemon.json');
        defaultMoves(callback);
    });
};

function insertGymIfNew(gym, callback) {
    db.get('SELECT * FROM GYMS WHERE G_ID = $id LIMIT 1', {
        $id: gym.gym_state.fort_data.id
    }, function (err, row) {
        if (!err) {
            if (!row) {
                console.log('[PogoBot].[Database] - Added a new gym to the list');
                db.run('INSERT INTO GYMS (G_ID, G_LAT, G_LON, G_NAME, G_IMG) VALUES ($id, $lat, $lon, $name, $img)', {
                    $id: gym.gym_state.fort_data.id,
                    $lat: gym.gym_state.fort_data.latitude,
                    $lon: gym.gym_state.fort_data.longitude,
                    $name: gym.name,
                    $img: gym.urls[0]
                }, {}, callback);
            } else {
                callback();
            }
        } else {
            console.log('[PogoBot].[ER_0004] - Error while checking if gym exists: ' + err);
        }
    });
};

function insertGymData(gym, timestamp, callback) {
    db.get('SELECT * FROM GYM_DATA WHERE GD_ID_GYM = $id AND GD_POINTS != $points ORDER BY GD_TIMESTAMP DESC LIMIT 1', {
	$id: gym.gym_state.fort_data.id,
	$points: gym.gym_state.fort_data.gym_points
    }, function (err, row) {
	var gymPoints = gym.gym_state.fort_data.gym_points * 1;
	var rowPoints = (row ? row.GD_POINTS : gymPoints) * 1;
	gym.growing = gymPoints > rowPoints ? 1 : gymPoints < rowPoints ? 2 : 0;
        callback();
    });
}

function insertNewDataUpdate(gym, timestamp, callback) {
    db.run('INSERT INTO GYM_DATA (GD_ID_GYM, GD_TIMESTAMP, GD_POINTS, GD_LEVEL, GD_OWNER_TEAM, GD_IS_IN_BATTLE, GD_IS_GROWING) VALUES ($id, $time, $points, (SELECT L_ID FROM LEVELS WHERE $points >= L_MIN_POINTS ORDER BY L_MIN_POINTS DESC LIMIT 1), $owner, $inbattle, $growing)', {
        $id: gym.gym_state.fort_data.id,
        $time: timestamp,
        $points: gym.gym_state.fort_data.gym_points,
        $owner: gym.gym_state.fort_data.owned_by_team,
        $inbattle: gym.gym_state.fort_data.is_in_battle,
	$growing: gym.growing
    }, function (err) {
        if (err) {
            console.log('[PogoBot].[ER_0005] - Error while inserting new gym data: ' + err);
        } else {
            callback();
        }
    });
};

function insertOrUpdatePkmn(pkmn, callback) {
    db.run('INSERT OR REPLACE INTO POKEMONS (P_ID, P_ID_SPECIES, P_CP, P_STAMINA, P_STAMINA_MAX, P_ID_MOVE_1, P_ID_MOVE_2, P_OWNER_NAME, P_HEIGHT, P_WEIGHT, P_IND_ATK, P_IND_DEF, P_IND_STM, P_CP_MULTIPLIER, P_UPGRADES, P_NICKNAME) VALUES ($id, $pkmn_id, $cp, $stm, $stm_max, $mv1, $mv2, $owner_name, $height, $weight, $ind_atk, $ind_def, $ind_stm, $cp_multiplier, $upgrades, $nickname)', {
        $id: pkmn.id,
        $pkmn_id: pkmn.pokemon_id,
        $cp: pkmn.cp,
        $stm: pkmn.stamina,
        $stm_max: pkmn.stamina_max,
        $mv1: pkmn.move_1,
        $mv2: pkmn.move_2,
        $owner_name: pkmn.owner_name,
        $height: pkmn.height_m,
        $weight: pkmn.weight_kg,
        $ind_atk: pkmn.individual_attack,
        $ind_def: pkmn.individual_defense,
        $ind_stm: pkmn.individual_stamina,
        $cp_multiplier: pkmn.cp_multiplier,
        $upgrades: pkmn.num_upgrades,
        $nickname: pkmn.nickname
    }, callback);
};

function insertRelationship(pkmn_id, gym_id, timestamp, callback) {
    db.run('INSERT INTO GYM_DATA_POKEMONS (GDP_ID_GYM_DATA, GDP_ID_POKEMON) VALUES ((SELECT GD_ID FROM GYM_DATA WHERE GD_ID_GYM = $gym_id AND GD_TIMESTAMP = $ts LIMIT 1), $pkmn_id)', {
        $gym_id: gym_id,
        $ts: timestamp,
        $pkmn_id: pkmn_id
    }, callback);
};

function defaultTypes(file) {
    var types = require(file);
    db.serialize(function () {
        db.run('DELETE FROM TYPES', function (err) {
            if (err) {
                console.log('[PogoBot].[ER_0015] - Unable to delete types: ' + err);
            }
        });
        var stmt = db.prepare('INSERT INTO TYPES (T_ID, T_NAME, T_EFFICIENCY, T_COLOR) VALUES ($id, $name, $eff, $col)', function () {
            console.log('[PogoBot].[Database] - Creating default types');
        });
        types.forEach(function (t, index) {
            stmt.run({
                $id: (index + 1),
                $name: t.name,
                $eff: t.eff,
                $col: t.color
            }, function (err) {
                if (err) {
                    console.log('[PogoBot].[ER_0016] - Unable to insert new type: ' + err);
                }
            });
        });
        stmt.finalize(function () {
            console.log('[PogoBot].[Database] - Types, DONE.');
        });
    });
};

function defaultSpecies(file) {
    var species = require(file);
    db.serialize(function () {
        db.run('DELETE FROM POKEMON_SPECIES', [], function (err) {
            if (err) {
                console.log('[PogoBot].[ER_0017] - Unable to delete species: ' + err);
            }
        });
        var stmt = db.prepare('INSERT INTO POKEMON_SPECIES VALUES ($id, $name, $rarity, (SELECT T_ID FROM TYPES WHERE T_NAME LIKE $type1), (SELECT T_ID FROM TYPES WHERE T_NAME LIKE $type2))', function () {
            console.log('[PogoBot].[Database] - Creating default pokemon species data');
        });
        for (var sp in species) {
            if (sp <= 151) {
                stmt.run({
                    $id: sp,
                    $name: species[sp].name,
                    $rarity: species[sp].rarity,
                    $type1: (species[sp].types.length > 0) ? species[sp].types[0].type : null,
                    $type2: (species[sp].types.length > 1) ? species[sp].types[1].type : null
                }, function (err) {
                    if (err) {
                        console.log('[PogoBot].[ER_0018] - Unable to insert new specie: ' + err);
                    }
                });
            }
        }
        stmt.finalize(function () {
            console.log('[PogoBot].[Database] - Species, DONE.');
        });
    });
};

function defaultMoves(callback) {
    db.serialize(function () {
        db.run('DELETE FROM MOVES', function (err) {
            if (err) {
                console.log('[PogoBot].[ER_0019] - Unable to delete moves: ' + err);
            }
        });
        var stmt = db.prepare('INSERT INTO MOVES (M_ID, M_NAME, M_TYPE) VALUES ($id, $name, $type)', function () {
            console.log('[PogoBot].[Database] - Reset of the moves database.');
        });
        for (var i = 0; i < 400; i++) {
            stmt.run( /*'INSERT INTO MOVES (M_ID, M_NAME, M_TYPE) VALUES ($id, $name, $type)', */ {
                $id: i,
                $name: '?',
                $type: null
            }, function (err) {
                if (err) {
                    console.log('[PogoBot].[ER_0020] - Unable to insert new move: ' + err);
                }
            });
        }
        stmt.finalize(function () {
            console.log('[PogoBot].[Database] - Moves, DONE.');
            callback();
        });
    });
};

function storeGymPokemons (gym, timestamp) {
        var memberships = gym.gym_state.memberships;
        if (memberships) {
            db.serialize(function () {
                memberships.forEach(function (pkmn) {
                    insertOrUpdatePkmn(pkmn.pokemon_data, function (err) {
                        if (err) {
                            console.log('[PogoBot].[ER_0021] - Unable to insert pokemon: ' + err);
                        }
                    });
                    insertRelationship(pkmn.pokemon_data.id, gym.gym_state.fort_data.id, timestamp, function (err) {
                        if (err) {
                            console.log('[PogoBot].[ER_0022] - Unable to insert pokemon in gym_status: ' + err);
                        }
                    });
                });
            });
        } else {
            console.log('[PogoBot].[Database] - No pokemon to be stored');
        }
    };


    function storeGymAndData (gym, timestamp, callback) {
        insertGymIfNew(gym, function() {
            insertGymData(gym, timestamp, function() {
                insertNewDataUpdate(gym, timestamp, function(){
                    callback();
                });
            });
        });
    };

module.exports = {

    initialize: function (callback) {
        fs.stat(path.join(__dirname, '../db/pogobot.db'), function (err) {
            db = new sqlite.Database(path.join(__dirname, '../db/pogobot.db'));
            if (err) {
                initDatabase(callback);
            } else {
                callback();
            }
        });
    },



    getGyms: function (callback) {
        db.all(' SELECT * FROM GYMS)', callback);
    },

    getFatGyms: function (callback) {
        db.all('SELECT * FROM GYMS ' +
            'JOIN GYM_DATA ON G_ID = GD_ID_GYM AND GD_TIMESTAMP = (SELECT MAX(GD_TIMESTAMP) FROM GYM_DATA WHERE GD_ID_GYM = G_ID) ', callback);
    },

    getGym: function (id, callback) {
        db.get('SELECT * FROM GYMS WHERE G_ID = $id', {
            $id: id
        }, callback);
    },

    getGymAndStatus: function (id, callback) {
        db.get('SELECT * FROM GYM_DATA JOIN GYMS ON G_ID = GD_ID_GYM JOIN LEVELS ON GD_LEVEL = L_ID WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1', {
            $id: id
        }, callback);
    },

    isGymGrowing: function (id, callback) {
        db.get(
            'WITH LAST AS (SELECT DISTINCT GD_POINTS AS ACTUAL_POINTS FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1),' +
            'SECOND_LAST AS (SELECT DISTINCT GD_POINTS AS PREVIOUS_POINTS FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1 OFFSET 1)' +
            'SELECT CASE WHEN ACTUAL_POINTS > PREVIOUS_POINTS THEN 1 WHEN ACTUAL_POINTS < PREVIOUS_POINTS THEN 2 ELSE 0 END AS GROWING FROM LAST LEFT JOIN SECOND_LAST', {
                $id: id
            }, callback);
    },

    getPokemons: function (id, callback) {
        db.all('SELECT * FROM POKEMONS LEFT JOIN POKEMON_SPECIES ON PS_ID = P_ID_SPECIES LEFT JOIN MOVES AS M1 ON P_ID_MOVE_1 = M1.M_ID LEFT JOIN MOVES AS M2 ON P_ID_MOVE_2 = M2.M_ID WHERE P_ID IN (SELECT GDP_ID_POKEMON FROM GYM_DATA_POKEMONS WHERE GDP_ID_GYM_DATA = (SELECT GD_ID FROM GYM_DATA WHERE GD_ID_GYM = $id ORDER BY GD_TIMESTAMP DESC LIMIT 1))', {
            $id: id
        }, callback);
    },

    getLevel: function getLevel(callback) {
        db.all('SELECT * FROM LEVELS;', {}, callback);
    },

    storeGymDataAndPokemons: function (gym, timestamp) {
        storeGymAndData(gym, timestamp, function(){
            storeGymPokemons(gym, timestamp);
        });
    },



    close: function () {
        db.close();
    },

    populateTypes: function (file) {
        defaultTypes(file);
    },

    populateSpecies: function (file) {
        defaultSpecies(file);
    },

    resetMoves: function () {
        defaultMoves();
    }
};
