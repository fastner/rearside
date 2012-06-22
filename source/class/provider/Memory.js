(function() {
	
	core.Class("rearside.provider.Memory", {
		construct : function() {
			this.__data = {};
		},
		
		members : {
			__data : null,
			
			countAllEntities : function(callback) {
				var count = 0;
				
				for (var key in this.__data) {
					if (this.__data.hasOwnProperty(key)) {
						count++;
					}
				}
				
				callback(count);
			},
			
			update : function(entity, callback) {
				var id = entity.id();
				
				this.__data[id] = entity.toJSONString();
				callback(id);
			},
			
			remove : function(entity, callback) {
				var id = entity.id();
				
				delete this.__data[id];
				callback(id);
			},
			
			get : function(id, callback) {
				var data = JSON.parse(this.__data[id]);
				
				if (!data) {
					callback(false);
					return;
				}
				
				rearside.Model(data.type);
				var EntityModel = rearside.Model(data.type);
				data.data.id = data.id;
				var entity = new EntityModel(data.data);
				callback(entity);
			},
			
			query : function(callback, meta, filter) {
				var data = this.__data;
				var result = [];
				
				var EntityModel = rearside.Model(meta.name);
				
				for (var key in data) {
					var entry = JSON.parse(data[key]);
					
					if (meta.name == entry.type) {
						entry.data.id = entry.id;
						
						if (filter.match(entry.data)) {
							result.push(new EntityModel(entry.data));
						}
					}
				}
				
				callback(result);
			}
		}
	});
	
})();