const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('pogobot.db');

function insertGymIfNew(gym) {
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
                });
            }
        } else {
            console.log('[PogoBot].[ER_0004] - Error while checking if gym exists: ' + err);
        }
    });
};

function insertNewDataUpdate(gym) {
    db.run('INSERT INTO GYM_DATA (GD_ID_GYM, GD_TIMESTAMP, GD_POINTS, GD_LEVEL, GD_OWNER_TEAM, GD_IS_IN_BATTLE) VALUES ($id, $time, $points, (SELECT L_ID FROM LEVELS WHERE $points >= L_MIN_POINTS ORDER BY L_MIN_POINTS DESC LIMIT 1), $owner, $inbattle)', {
        $id: gym.gym_state.fort_data.id,
        $time: new Date().getTime(),
        $points: gym.gym_state.fort_data.gym_points,
        $owner: gym.gym_state.fort_data.owned_by_team,
        $inbattle: gym.gym_state.fort_data.is_in_battle
    }, function (err) {
        if (err) {
            console.log('[PogoBot].[ER_0005] - Error while inserting new gym data: ' + err);
        }
    });
};

module.exports = {

    storeGymAndData: function (gym) {
        db.serialize(function () {
            insertGymIfNew(gym);
            insertNewDataUpdate(gym);
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

    getLevel: function getLevel(lvl, callback) {
        db.get('SELECT * FROM LEVELS WHERE L_ID = $lvl', {
            $lvl: lvl
        }, callback);
    },

    insertOrUpdatePkmn: function (pkmn, callback) {
        db.run('INSERT INTO POKEMONS (P_ID, P_ID_SPECIES, P_CP, P_STAMINA, P_STAMINA_MAX, P_ID_MOVE_1, P_ID_MOVE_2, P_OWNER_NAME, P_HEIGHT, P_WEIGHT, P_IND_ATK, P_IND_DEF, P_IND_STM, P_CP_MULTIPLIER, P_UPGRADES, P_NICKNAME) VALUES ($id, $pkmn_id, $cp, $stm, $stm_max, $mv1, $mv2, $owner_name, $height, $weight, $ind_atk, $ind_def, $ind_stm, $cp_multiplier, $upgrades, $nickname)', {
            $id: pkmn.id,
            $pkmn_id: pkmn.pokemon_id,
            $cp: pkmn.cp,
            $stm: pkmn.pokemon_stamina,
            $stm_max: pkmn.pokemon_stamina_max,
            $mv1: pkmn.move1,
            $mv2: pkmn.move2,
            $owner_name: pkmn.owner,
            $height: pkmn.height_m,
            $weight: pkmn.weight_kg,
            $ind_atk: pkmn.individual_attack,
            $ind_def: pkmn.individual_defense,
            $ind_stm: pkmn.individual_stamina,
            $cp_multiplier: pkmn.cp_multiplier,
            $upgrades: pkmn.number_upgrades,
            $nickname: pkmn.nickname
        }, callback);
    },

    close: function () {
        db.close();
    },

    populateTypes: function (file) {
        console.log('[PogoBot] - Creating default types');
        var types = require(file);
        db.serialize(function () {
            db.run('DELETE FROM TYPES', function (err) {
                if (err) {
                    console.log('[PogoBot].[ER_0015] - Unable to delete types: ' + err);
                }
            });
            types.forEach(function (t, index) {
                db.run('INSERT INTO TYPES (T_ID, T_NAME, T_EFFICIENCY, T_COLOR) VALUES ($id, $name, $eff, $col)', {
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
            console.log('[PogoBot] - Types, DONE.');
        });
    },

    populateSpecies: function (file) {
        console.log('[PogoBot] - Creating default pokemon species data');
        var species = require(file);
        db.serialize(function () {
            db.run('DELETE FROM POKEMON_SPECIES', function (err) {
                if (err) {
                    console.log('[PogoBot].[ER_0017] - Unable to delete species: ' + err);
                }
            });
            for (var sp in species) {
                if (sp <= 151) {
                    db.run('INSERT INTO POKEMON_SPECIES VALUES ($id, $name, $rarity, (SELECT T_ID FROM TYPES WHERE T_NAME LIKE $type1), (SELECT T_ID FROM TYPES WHERE T_NAME LIKE $type2))', {
                        $id: sp,
                        $name: species[sp].name,
                        $rarity: species[sp].rarity,
                        $type1: species[sp].types[0].type,
                        $type2: (species[sp].types.length > 1) ? species[sp].types[1].type : null
                    }, function (err) {
                        if (err) {
                            console.log('[PogoBot].[ER_0018] - Unable to insert new specie: ' + err);
                        }
                    });
                }
            }
            console.log('[PogoBot] - Species, DONE.');
        });
    }
};