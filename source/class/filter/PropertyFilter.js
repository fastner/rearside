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
 
(function() {
	
	core.Class("rearside.filter.PropertyFilter", {
		construct : function(property, check, value) {
			this.__property = property;
			this.__value = value;
			this.__check = check;
			
			this.__selectMatcher(check);
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
			},
			
			__selectMatcher : function(check) {
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
			
			sql : function() {
				var check = this.__check;
				var property = this.__property;
				var value = this.__value;
				
				switch (check) {
					case "contains":
						return {sql: [property + " LIKE ?"], values: ["%"+value+"%"]};
					case "contains not":
						return {sql: [property + " NOT LIKE ?"], values: ["%"+value+"%"]};
					case "=":
						return {sql: [property + "=?"], values: [value]};
					case "!=":
						return {sql: [property + "!=?"], values: [value]};
					case "<":
						return {sql: [property + "<?"], values: [value]};
					case ">":
						return {sql: [property + ">?"], values: [value]};
					case "<=":
						return {sql: [property + "<=?"], values: [value]};
					case ">=":
						return {sql: [property + ">=?"], values: [value]};
					default:
						throw new Error("Check '" + check + "' is not allowed as property filter");
				}
			}
		}
	});

})();