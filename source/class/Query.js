(function() {

	core.Class("rearside.Query", {
		construct : function(store, meta) {
			this.__store = store;
			this.__meta = meta;
		},
		
		members : {
			__store : null,
			__meta : null,
			__filter : null,
			
			__addFilter : function(filter) {
				var oldFilter = this.__filter;
				if (oldFilter) {
					this.__filter = new rearside.filter.AndFilter(oldFilter, filter);
				} else {
					this.__filter = filter;
				}
			},
			
			filter : function(property, check, value) {
				this.__addFilter(new rearside.filter.PropertyFilter(property, check, value));
				
				return this;
			},
			
			list : function(callback) {
				this.__store.query(callback, this.__meta, this.__filter);
			}
		}
	});
	
})();