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
		
		getStore : function() {
			return this._store;
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
			
			this._store.queue(this);
			
			return value;
		}
	};
	
	var getEntity = function(name) {
		var entityClass = entityClassCache[name];
		if (entityClass) {
			return entityClass;
		}
		
		var meta = entityCache[name];
		
		var clazz = entityClassCache[name] = function(store, config) {
			this._meta = meta;
			var data = this._data = {};
			this._id = config.id || createUUID();
			this._dirtyProperties = [];
			this._store = store;
			
			var fields = meta.fields;
			for (var key in fields) {
				var field = fields[key];
				if (field) {
					data[key] = config[key] || getDefaultValue(fields[key]);
				} else {
					throw new Error("Field " + key + " is not defined in model " + meta.name);
				}
			}
		};
		
		var proto = clazz.prototype;
		for (var key in entityMembers) {
			proto[key] = entityMembers[key];
		}
		
		return clazz;
	};
	
	core.Main.declareNamespace("rearside.Model", function(name, config) {
		
		if (core.Env.isSet("debug")) {
			if (!core.Module.isModuleName(name)) {
				throw new Error("Invalid model name " + name + "!");
			}
			
			core.Assert.isType(config, "Map", "Invalid model configuration in " + name);
			
			if (entityCache[name]) {
				throw new Error("Model " + name + " is already created!");
			}
		}
		
		if (entityCache[name]) {
			return getEntity(name);
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