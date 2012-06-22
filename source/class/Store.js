(function() {

	core.Class("rearside.Store", {
		construct : function(storeProvider) {
			if (core.Env.getValue("debug")) {
				if (!storeProvider) {
					throw new Error("No store provider set");
				}
			}
			
			this.__dirty = [];
			this.__storeProvider = storeProvider;
		},
		
		members : {
			__dirty : null,
			__storeProvider : null,
			
			getStoreProvider : function() {
				return this.__storeProvider;
			},
			
			queue : function(entity) {
				this.__dirty.push(entity);
			},
			
			getQueue : function() {
				return this.__dirty.slice();
			}
		}
	});
	
})();