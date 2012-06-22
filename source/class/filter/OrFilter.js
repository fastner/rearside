(function() {
	
	core.Class("rearside.filter.OrFilter", {
		construct : function(filter1, filter2) {
			this.__filter1 = filter1;
			this.__filter2 = filter2;
		},
		
		members : {
			__filter1 : null,
			__filter2 : null,
			
			match : function(entity) {
				return this.__filter1.match(entity) || this.__filter2.match(entity);
			}
		}
	});

})();