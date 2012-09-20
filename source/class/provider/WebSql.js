/* =============================================================================
 *
 * Rearside - a lightweight JavaScript model and persistence library
 *
 *
 * Copyright (C) 2012 Sebastian Fastner, Mainz, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
 
(function(global) {
	
	var metadb = global.openDatabase("rearside-meta", "1.0", "", 1024*1024);
	
	metadb.transaction(function (metatx) {
		metatx.executeSql('CREATE TABLE IF NOT EXISTS version (id unique, version)');
	});
	
	var getCreateSql = function(meta) {
		var entries = ["id unique", "timestamp"];
		
		for (var key in meta.fields) {
			entries.push(key);
		}
		
		return entries.join(",");
	};
	
	var modelRegistry = {};
	
	var errorHandler = function(id) {
		console.error(id, arguments);
	};
	
	core.Class("rearside.provider.WebSql", {
		construct : function(namespace, version, options) {
			if (jasy.Env.getValue("debug")) {
				if (!window.openDatabase) {
					throw new Error("No WebSQL available");
				}
				if (!namespace) {
					throw new Error("WebSQL provider needs namespace");
				}
			}
			
			this.__namespace = namespace;
			this.__options = options || {
				description: "",
				size: 1048576 // 1MB
			};
			
			this.__version = version || 0;
		},
		
		members : {
			__db : null,
			__needUpdate : false,
			__namespace : null,
			__options : null,
			__version : null,
			
			__jsonParse : function(data) {
				if (data == null) {
					return data;
				}
				
				return JSON.parse(data);
			},
			
			__createEntityTable : function(tx, callback, meta) {
				var name = meta.name;
				
				var todo = 2;
				var cb = function() {
					todo--;
					if (todo == 0) {
						if (callback) callback();
					}
				};
				
				tx.executeSql('INSERT INTO rearside (name, meta) VALUES (?, ?)', [name, JSON.stringify(meta)], cb, errorHandler.bind(this, 1));
				tx.executeSql('CREATE TABLE ' + name + ' (' + getCreateSql(meta) + ')', null, cb, errorHandler.bind(this, 2));
			},
			
			register : function(model, callback) {
				var meta = model.getMeta();
				var name = meta.name;
				modelRegistry[name] = model;
				
				var self = this;
				
				this.__db.transaction(function(tx) {
					tx.executeSql('SELECT * FROM rearside WHERE NAME=?', [name], function(tx, results) {
						if (results.rows.length <= 0) {
							self.__createEntityTable(tx, callback, meta);
						}
					});
				});
			},
			
			__createDB : function(db, callback, doMigration, oldVersion, newVersion) {
				if (!db) {
					db = this.__db = global.openDatabase(this.__namespace, 1, this.__options.description, this.__options.size);
				}
				db.transaction(function(tx) {
					var todo = 2;
					var cb = function() {
						todo--;
						
						if (todo === 0) {
							if (callback) callback(doMigration, newVersion, oldVersion);
						}
					};
					tx.executeSql('CREATE TABLE IF NOT EXISTS rearside (name unique, meta)', null, cb);
					tx.executeSql('CREATE TABLE IF NOT EXISTS rearside_index (id unique, type)', null, cb);
				});
			},
			
			open : function(callback, migration) {
				var self = this;
				var version = this.__version;
				var namespace = this.__namespace;
				var options = this.__options;
				
				metadb.transaction(function (metatx) {
					metatx.executeSql('SELECT * FROM version WHERE id=?', [namespace], function (metatx, results) {
						var len = results.rows.length;
						
						if (len > 0) {
							// Old db available
							var oldVersion = results.rows.item(0).version;
						
							if (oldVersion != version) {
								this.__needUpdate = [oldVersion, version];
							
								metatx.executeSql('UPDATE version SET version=? WHERE id=?', [version, this.__namespace], function() {
									var db = global.openDatabase(namespace, 1, options.description, options.size);
									db.transaction(function(tx) {
										if (migration) {
											migration(tx, oldVersion, version);
										}
										self.__createDB.call(self, db, callback, true, oldVersion, version);
									});
								});
							
							} else {
								self.__createDB.call(self, null, callback, false, null, version);
							}
							
						} else {
							// First entry
							metatx.executeSql('INSERT INTO version (id, version) VALUES (?, ?)', [namespace, version]);
							self.__createDB.call(self, null, callback, false, null, version);
						}
					});
					
				});
			},
			
			countAllEntities : function(callback) {
				var count = 0;
				
				this.__db.transaction(function(tx) {
					tx.executeSql('SELECT * FROM rearside_index', [], function(tx, results) {
						if (callback) callback(results.rows.length);
					});
				});
			},
			
			update : function(entity, callback) {
				var id = entity.id();
				var name = entity.getMeta().name;
				var fields = ["id", "timestamp"];
				for (var key in entity.getMeta().fields) {
					fields.push(key);
				}
				var questmarks = [];
				var content = [];
				for (var i=0,ii=fields.length; i<ii; i++) {
					questmarks.push("?");
					var key = fields[i];
					if (key == "id") {
						content.push(entity.id());
					} else if (key == "timestamp") {
						content.push(entity.timestamp());
					} else {
						var e = entity.get(fields[i]);
						if (e instanceof rearside.Query) {
							e = e.serialize();
						}
						content.push(e);
					}
				}
				
				this.__db.transaction(function(tx) {
					tx.executeSql('INSERT OR REPLACE INTO ' + name + ' (' + fields.join(",") + ') VALUES (' + questmarks.join(",") + ')', content, function(tx) {
						
						tx.executeSql('INSERT OR IGNORE INTO rearside_index (id, type) VALUES (?, ?)', [id, name], function(tx) {
							if (callback) callback(id);
						}, function() {
							console.error("ERROR ", arguments);
						});
						
					});
				});
			},
			
			remove : function(entity, callback) {
				var id = entity.id();
				
				this.__db.transaction(function(tx) {
					tx.executeSql('SELECT * FROM rearside_index WHERE id=?', [id], function(tx, results) {
						
						if (results.rows.length <= 0) {
							if (callback) callback(false);
							return;
						}
						
						var type = results.rows.item(0).type;
						
						tx.executeSql('DELETE FROM ' + type + ' WHERE id=?', [id], function(tx, results) {
							
							tx.executeSql('DELETE FROM rearside_index WHERE id=?', [id], function(tx, results) {
							
								if (callback) callback(id);
							
							}, function() {
								if (callback) callback(false);
							});
							
						}, function() {
							if (callback) callback(false);
						});
						
					}, function() {
						if (callback) callback(false);
					});
				});
			},
			
			purge : function(callback) {
				this.__db.transaction(function(tx) {
					tx.executeSql('SELECT * FROM rearside', null, function(tx, results) {
						tx.executeSql("DELETE FROM rearside_index", null, function(tx) {
							for (var i=0,ii=results.rows.length; i<ii; i++) {
								var row = results.rows.item(i);
								var name = row.name;
								tx.executeSql("DELETE FROM " + name, null, callback, errorHandler.bind(this, 3));
							}
						}, errorHandler.bind(this, 5));
					});
				});
			},
			
			get : function(id, callback) {
				this.__db.transaction(function(tx) {
					tx.executeSql('SELECT * FROM rearside_index WHERE id=?', [id], function(tx, results) {
						
						if (results.rows.length <= 0) {
							if (callback) callback(false);
							return;
						}
						
						var type = results.rows.item(0).type;
						
						tx.executeSql('SELECT * FROM ' + type + ' WHERE id=?', [id], function(tx, results) {
							
							var data = results.rows.item(0);
							
							var EntityModel = rearside.Model(type);
							var entity = new EntityModel(data);
							
							if (callback) callback(entity);
							
						}, function() {
							if (callback) callback(false);
						});
						
					}, function() {
						if (callback) callback(false);
					});
				});
			},
			
			count : function(callback, meta, filter, idFilter, limit, skip, orders) {
				return this.query(callback, meta, filter, idFilter, limit, skip, orders).length;
			},
			
			query : function(callback, meta, filter, idFilter, limit, skip, orders) {
				var data = this.__data;
				var dataSet = {};
				var result = [];
				
				var EntityModel = rearside.Model(meta.name);
				
				var sql = ["SELECT * FROM " + meta.name];
				var where = [];
				var values = [];
				
				if (idFilter) {
					values = values.concat(idFilter);
					
					var idf = [];
					for (var i=0,ii=idFilter.length; i<ii; i++) {
						idf.push("?");
					}
					
					where.push("id IN (" + idf.join(",") + ")");
				}
				
				if (filter) {
					var f = filter.sql();
					where = where.concat(f.sql);
					values = values.concat(f.values);
				}
				
				if (where.length > 0) {
					sql.push("WHERE " + where.join(" AND "));
				}
				
				if (orders) {
					var ii = orders.length;
					if (ii > 0) {
						var orderResult = [];
						for (var i=0; i<ii; i++) {
							var order = orders[i];
							
							var o = order.property;
							if (order.order) {
								o += " " + order.order;
							}
							orderResult.push(o);
						}
						
						sql.push("ORDER BY " + orderResult.join(","));
					}
				}
				
				if (limit) {
					sql.push("LIMIT " + limit);
				}
				if (skip) {
					sql.push("OFFSET " + skip);
				}
				
				var sqlText = sql.join(" ");
				
				this.__db.transaction(function(tx) {
					tx.executeSql(sqlText, values, function(tx, results) {
						
						var result = [];
						
						for (var i=0,ii=results.rows.length; i<ii; i++) {
							var data = results.rows.item(i);
							
							result.push(new EntityModel(data));
						}
						
						if (callback) callback(result);
						
					}, function() {
						console.error("ERROR ", arguments);
						if (callback) callback([]);
					});
				});
			}
		}
	});
	
})(this);