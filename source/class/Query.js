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
			__idFilter : null,
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
			
			find : function(ids) {
				if (!(ids instanceof Array)) {
					ids = [ids];
				}
				this.__idFilter = ids;
				
				return this;
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
				this.__store.count(callback, this.__meta, this.__filter, this.__idFilter, this.__limit, this.__skip, this.__order);
			},
			
			one : function(callback) {
				this.__store.query(function(result) {
					callback(result ? result[0] : null);
				}, this.__meta, this.__filter, this.__idFilter, 1, this.__skip, this.__order);
			},
			
			list : function(callback) {
				this.__store.query(callback, this.__meta, this.__filter, this.__idFilter, this.__limit, this.__skip, this.__order);
			},
			
			serialize : function() {
				return this.__idFilter;
			}
		}
	});
	
})();