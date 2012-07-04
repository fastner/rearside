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
	
	var dataStore = {};
	var dsVersion = {};
	
	core.Class("rearside.provider.Memory", {
		construct : function(namespace, version) {
			if (core.Env.getValue("debug")) {
				if (!namespace) {
					throw new Error("Memory provider needs namespace");
				}
			}
			
			var ds = dataStore[namespace];
			if (!ds) {
				ds = dataStore[namespace] = {};
			}
			this.__data = ds;
			
			this.__namespace = namespace;
			
			var oldVersion = dsVersion[namespace];
			if (oldVersion != version) {
				dsVersion[namespace] = version;
				this.__needUpdate = [oldVersion, version];
			}
		},
		
		members : {
			__data : null,
			__namespace : null,
			__needUpdate : false,
			
			__jsonParse : function(data) {
				if (data == null) {
					return data;
				}
				
				return JSON.parse(data);
			},
			
			register : function(model) {
			},
			
			open : function(callback) {
				if (this.__needUpdate !== false) {
					var v = this.__needUpdate;
					dsVersion[this.__namespace] = v[1];
					if (callback) {
						callback(true, v[1], v[0]);
					}
				} else {
					if (callback) {
						callback(false);
					}
				}
			},
			
			countAllEntities : function(callback) {
				var count = 0;
				
				for (var key in this.__data) {
					if (this.__data.hasOwnProperty(key)) {
						count++;
					}
				}
				
				if (callback) callback(count);
			},
			
			update : function(entity, callback) {
				var id = entity.id();
				
				this.__data[id] = entity.toJSONString();
				if (callback) callback(id);
			},
			
			remove : function(entity, callback) {
				var id = entity.id();
				
				delete this.__data[id];
				if (callback) callback(id);
			},
			
			purge : function(callback) {
				this.__data = {};
				if (callback) callback();
			},
			
			get : function(id, callback) {
				var data = this.__jsonParse(this.__data[id]);
				
				if (!data) {
					if (callback) callback(false);
					return;
				}
				
				rearside.Model(data.type);
				var EntityModel = rearside.Model(data.type);
				data.data.id = data.id;
				data.data.timestamp = data.timestamp;
				var entity = new EntityModel(data.data);
				if (callback) callback(entity);
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
					var entry = this.__jsonParse(data[key]);
					
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
				
				if (callback) callback(result);
			}
		}
	});
	
})();