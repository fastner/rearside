(function() {

	core.Class("rearside.Query", {
		construct : function(store, meta) {
			this.__store = store;
			this.__meta = meta;
			this.__order = [];
		},
		
		members : {
			__store : null,
			__meta : null,
			__filter : null,
			__limit : null,
			__order : null,
			__skip : 0,
			
			__addFilter : function(filter) {
				var oldFilter = this.__filter;
				if (oldFilter) {
					this.__filter = new rearside.filter.AndFilter(oldFilter, filter);
				} else {
					this.__filter = filter;
				}
			},
			
			__orFilter : function(filter) {
				var oldFilter = this.__filter;
				if (oldFilter) {
					this.__filter = new rearside.filter.OrFilter(oldFilter, filter);
				} else {
					this.__filter = filter;
				}
			},
			
			filter : function(property, check, value) {
				this.__addFilter(new rearside.filter.PropertyFilter(property, check, value));
				
				return this;
			},
			
			and : function(filter) {
				this.__addFilter(filter);
				
				return this;
			},
			
			or : function(filter) {
				this.__orFilter(filter);
				
				return this;
			},
			
			limit : function(num) {
				this.__limit = num;
				
				return this;
			},
			
			skip : function(num) {
				this.__skip = num;
				
				return this;
			},
			
			order : function(property, order) {
				this.__order.push({
					property: property,
					order: order
				});
				
				return this;
			},
			
			count : function(callback) {
				this.__store.count(callback, this.__meta, this.__filter, this.__limit, this.__skip, this.__order);
			},
			
			one : function(callback) {
				this.__store.query(callback, this.__meta, this.__filter, 1, this.__skip, this.__order);
			},
			
			list : function(callback) {
				this.__store.query(callback, this.__meta, this.__filter, this.__limit, this.__skip, this.__order);
			}
		}
	});
	
})();