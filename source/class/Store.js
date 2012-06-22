(function() {

	core.Class("rearside.Store", {
		construct : function(storeProvider) {
			if (core.Env.getValue("debug")) {
				if (!storeProvider) {
					throw new Error("No store provider set");
				}
			}
			
			this.__dirty = [];
			this.__remove = [];
			this.__storeProvider = storeProvider;
		},
		
		members : {
			__dirty : null,
			__remove : null,
			__storeProvider : null,
			
			getStoreProvider : function() {
				return this.__storeProvider;
			},
			
			queue : function(entity) {
				this.__dirty.push(entity);
			},
			
			getQueue : function() {
				return this.__dirty.slice();
			},
			
			add : function(entity) {
				entity.addStore(this);
			},
			
			remove : function(entity) {
				entity.removeStore(this);
				this.__remove.push(entity);
			},
			
			get : function(id, callback) {
				this.__storeProvider.get(id, callback);
			},
			
			flush : function(callback) {
				var todo = 1;
				
				var cb = function() {
					todo--;
					
					if (todo == 0) callback();
				};
				
				var entity = this.__dirty.pop();
				while (entity) {
					todo++;
					this.__storeProvider.update(entity, cb)
					entity = this.__dirty.pop();
				}
				
				entity = this.__remove.pop();
				while (entity) {
					todo++;
					this.__storeProvider.remove(entity, cb);
					entity = this.__dirty.pop();
				}
				
				todo--;
				if (todo == 0) callback();
			},
			
			query : function(callback, meta, filter, limit) {
				this.__storeProvider.query(callback, meta, filter, limit);
			}
		}
	});
	
})();