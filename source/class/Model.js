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
 
(function(){
	
	var now = window.now || function() { return (new Date).valueOf(); };
	
	var entityCache = {};
	var entityClassCache = {};
	
	var createUUID = function() {
		var s = [];
		var hexDigits = "0123456789ABCDEF";
		for ( var i = 0; i < 32; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[12] = "4";
		s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
		
		var uuid = s.join("");
		return uuid;
	};
	
	var getDefaultValue = function(type) {
		switch (type) {
			case "string":
				return "";
			case "number":
				return 0;
			case"boolean":
				return false;
			case "object":
				return {};
		}
		
		return null;
	};
	
	var entityMembers = {
		id : function() {
			return this._id;
		},
		
		timestamp : function() {
			return this._timestamp;
		},
		
		getType : function() {
			return this._meta.name;
		},
		
		dirtyProperties : function() {
			return this._dirtyProperties.slice();
		},
		
		isDirty : function() {
			return this._dirtyProperties.length > 0;
		},
		
		getStore : function() {
			return this._store;
		},
		
		setStore : function(store) {
			if (this._store) {
				return false;
			}
			this._store = store;
			
			if (this.isDirty()) {
				store.queue(this);
			}
			
			return true;
		},
		
		removeStore : function(store) {
			var mystore = this._store;
			
			if (mystore === store) {
				this._store = null;
				return true;
			} else {
				return false;
			}
		},
		
		get : function(name) {
			if (core.Env.getValue("debug")) {
				if (!this._meta.fields[name]) {
					throw new Error("No field " + name + " in model " + this._meta.name);
				}
			}
			
			var field = this._meta.fields[name];
			var simpleType = (typeof field == "string");
			
			if (simpleType) {
			
				return this._data[name];
			
			} else {
				
				var entity = getEntity(field[1]);
				return entity.query(this._store).find(this._data[name]);
				
			}
		},
		
		set : function(name, value) {
			var field = this._meta.fields[name];
			var simpleType = (typeof field == "string");
			
			if (core.Env.getValue("debug")) {
				if (!field) {
					throw new Error("No field " + name + " in model " + this._meta.name);
				}
				
				if (simpleType && typeof value != field) {
					throw new Error("Value " + value + " is not of type " + this._meta.fields[name] + " in model " + this._meta.name);
				}
				
				if (!simpleType) {
					for (var i=0,ii=value.length; i<ii; i++) {
						var val = value[i];
						
						if (val.getType() != field[1]) {
							throw new Error("Value type " + val.getType() + " is not of type " + field[1] + " in model " + this._meta.name);
						}
					}
				}
				
				if (name == "id") {
					throw new Error("Change of ID in model " + this._meta.name + " is not allowed");
				}
				
				if (name == "timestamp") {
					throw new Error("Change of timestamp in model " + this._meta.name + " is not allowed");
				}
			}
			
			if (simpleType) {
				this._data[name] = value;
			} else {
				var val;
				
				if (!(value instanceof Array)) {
					val = value.id();
				} else {
					val = [];
					for (var i=0,ii=value.length; i<ii; i++) {
						val.push(value[i].id());
					}
				}
				
				this._data[name] = val;
			}
			
			var dirtyProperties = this._dirtyProperties;
			if (dirtyProperties.indexOf(name) < 0) {
				this._dirtyProperties.push(name);
			}
			
			if (this._store) {
				this._store.queue(this);
			}
			
			return value;
		},
		
		equals : function(entity) {
			return (this.id() == entity.id() && this.timestamp() == entity.timestamp() && this.getType() == entity.getType());
		},
		
		toJSONString : function() {
			var el = {
				id: this._id,
				timestamp: this._timestamp,
				type: this._meta.name,
				data: this._data
			};
			return JSON.stringify(el);
		}
	};
		
	var getEntity = function(name) {
		var entityClass = entityClassCache[name];
		if (entityClass) {
			return entityClass;
		}
		
		var meta = entityCache[name];
		
		var clazz = entityClassCache[name] = function(config) {
			this._meta = meta;
			var data = this._data = {};
			this._id = config.id || createUUID();
			this._timestamp = config.timestamp || now();
			var dirtyProperties = this._dirtyProperties = [];
			this._store = null;
			
			var fields = meta.fields;
			for (var key in fields) {
				var field = fields[key];
				
				if (field) {
					data[key] = config[key] || getDefaultValue(fields[key]);
					dirtyProperties.push(key);
				} else {
					throw new Error("Field " + key + " is not defined in model " + meta.name);
				}
			}
		};
		
		var proto = clazz.prototype;
		for (var key in entityMembers) {
			proto[key] = entityMembers[key];
		}
		
		clazz.query = function(store) {
			return new rearside.Query(store, meta);
		};
		/*clazz.hasOne = function(property, type) {
			meta.hasOne[property] = type;
		};*/
		clazz.hasMany = function(property, type) {
			meta.fields[property] = ["list", type.getName()];
		};
		
		clazz.getName = function() {
			return name;
		};
		
		return clazz;
	};
	
	core.Main.declareNamespace("rearside.Model", function(name, config) {
		
		if (core.Env.isSet("debug")) {
			if (!core.Module.isModuleName(name)) {
				throw new Error("Invalid model name " + name + "!");
			}
		}
		
		if (entityCache[name]) {
			return getEntity(name);
		}
		
		if (core.Env.isSet("debug")) {
			core.Assert.isType(config, "Map", "Invalid model configuration in " + name);
			
			if (entityCache[name]) {
				throw new Error("Model " + name + " is already created!");
			}
		}
		
		for (var key in config) {
			if (typeof config[key] != "string") {
				config[key] = ["object", config[key].getName()];
			}
		}
		
		var meta = {
			name: name,
			fields: config,
			indexes: [],
			hasMany: {},
			hasOne: {}
		};
		entityCache[name] = meta;
		
		return getEntity(name);
	});
	
})();