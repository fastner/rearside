(function() {
	
	core.Class("rearside.filter.PropertyFilter", {
		construct : function(property, check, value) {
			this.__property = property;
			this.__value = value;
			
			switch (check) {
				case "contains":
					this.__matcher = this.__containsMatcher;
					break;
				case "contains not":
					this.__matcher = this.__containsNotMatcher;
					break;
				case "=":
					this.__matcher = this.__equalsMatcher;
					break;
				case "!=":
					this.__matcher = this.__unequalsMatcher;
					break;
				case "<":
					this.__matcher = this.__lowerMatcher;
					break;
				case ">":
					this.__matcher = this.__greaterMatcher;
					break;
				case "<=":
					this.__matcher = this.__lowerEqualsMatcher;
					break;
				case ">=":
					this.__matcher = this.__greaterEqualsMatcher;
					break;
				default:
					throw new Error("Check '" + check + "' is not allowed as property filter");
			}
		},
		
		members : {
			__property : null,
			__value : null,
			__matcher : null,
			
			match : function(entity) {
				var prop = entity[this.__property];
				
				return (prop && this.__matcher(prop, this.__value));
			},
			
			__containsMatcher : function(storeEntry, queryValue) {
				return String(storeEntry).indexOf(queryValue) >= 0;
			},
			
			__containsNotMatcher : function(storeEntry, queryValue) {
				return String(storeEntry).indexOf(queryValue) < 0;
			},
			
			__equalsMatcher : function(storeEntry, queryValue) {
				return storeEntry == queryValue;
			},
			
			__unequalsMatcher : function(storeEntry, queryValue) {
				return storeEntry != queryValue;
			},
			
			__lowerMatcher : function(storeEntry, queryValue) {
				return storeEntry < queryValue;
			},
			
			__greaterMatcher : function(storeEntry, queryValue) {
				return storeEntry > queryValue;
			},
			
			__lowerEqualsMatcher : function(storeEntry, queryValue) {
				return storeEntry <= queryValue;
			},
			
			__greaterEqualsMatcher : function(storeEntry, queryValue) {
				return storeEntry >= queryValue;
			}
		}
	});

})();