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
	
	core.Class("rearside.provider.Memory", {
		construct : function() {
			this.__data = {};
		},
		
		members : {
			__data : null,
			
			checkUpdates : function(callback) {
				callback(false);
			},
			
			transaction : function(callback) {
				callback(new rearside.Transaction(this, null));
			},
			
			commit : function(tx, callback) {
				callback();
			},
			
			rollback : function(tx, callback) {
				callback();
			},
			
			countAllEntities : function(tx, callback) {
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
				data.data.timestamp = data.timestamp;
				var entity = new EntityModel(data.data);
				callback(entity);
			},
			
			count : function(callback, meta, filter, idFilter, limit, skip, orders) {
				return this.query(callback, meta, filter, idFilter, limit, skip, orders).length;
			},
			
			query : function(callback, meta, filter, idFilter, limit, skip, orders) {
				var data = this.__data;
				var dataSet = {};
				var result = [];
				
				var EntityModel = rearside.Model(meta.name);
				
				for (var key in data) {
					var entry = JSON.parse(data[key]);
					
					if (meta.name == entry.type) {
						if ((!idFilter) || (idFilter.indexOf(entry.id) >= 0)) {
							entry.data.timestamp = entry.timestamp;
							entry.data.id = entry.id;
							
							if ((!filter) || filter.match(entry.data)) {
								result.push(new EntityModel(entry.data));
							}
						}
					}
				}
				
				if (orders && orders.length > 0) {
					var resultOrder = function(a,b) {
						for (var i=0,ii=orders.length; i<ii; i++) {
							var order = orders[i];
							
							var val;
							if (order.order != "desc") {
								val = a.get(order.property) - b.get(order.property);
							} else {
								val = b.get(order.property) - a.get(order.property);
							}
							if (val != 0) {
								return val;
							}
						}
						
						return 0;
					};
					result = result.sort(resultOrder);
				}
				
				if (limit) {
					result = result.slice(skip, skip+limit);
				}
				
				callback(result);
			}
		}
	});
	
})();