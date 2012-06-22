(function(){
	
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
		get : function(name) {
			if (core.Env.getValue("debug")) {
				if (!this._meta.fields[name]) {
					throw new Error("No field " + name + " in model " + this._meta.name);
				}
			}
			
			return this._data[name];
		},
		
		id : function() {
			return this._id;
		},
		
		dirtyProperties : function() {
			return this._dirtyProperties.slice();
		},
		
		isDirty : function() {
			return this._dirtyProperties.length > 0;
		},
		
		getStores : function() {
			return this._store;
		},
		
		addStore : function(store) {
			this._store.push(store);
			if (this.isDirty()) {
				store.queue(this);
			}
		},
		
		removeStore : function(store) {
			var stores = this._store;
			
			var pos = stores.indexOf(store);
			if (pos >= 0) {
				stores.splice(pos, 1);
			}
		},
		
		set : function(name, value) {
			if (core.Env.getValue("debug")) {
				if (!this._meta.fields[name]) {
					throw new Error("No field " + name + " in model " + this._meta.name);
				}
				
				if (typeof value != this._meta.fields[name]) {
					throw new Error("Value " + value + " is not of type " + this._meta.fields[name] + " in model " + this._meta.name);
				}
				
				if (name == "id") {
					throw new Error("Change of ID in model " + this._meta.name + " is not allowed");
				}
			}
			
			this._data[name] = value;
			
			var dirtyProperties = this._dirtyProperties;
			if (dirtyProperties.indexOf(name) < 0) {
				this._dirtyProperties.push(name);
			}
			
			var store = this._store;
			for (var i = 0, ii=store.length; i<ii; i++) {
				store.queue(this);
			}
			
			return value;
		},
		
		toJSONString : function() {
			var el = {
				id: this._id,
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
			var dirtyProperties = this._dirtyProperties = [];
			this._store = [];
			
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