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
 
(function(localStorage) {
	
	core.Class("rearside.provider.LocalStorage", {
		construct : function(namespace, version) {
			if (core.Env.getValue("debug")) {
				if (!localStorage) {
					throw new Error("No local storage available");
				}
				if (!namespace) {
					throw new Error("LocalStorage provider needs namespace");
				}
			}
			this.__namespace = namespace;
			version = version ? JSON.stringify(version) : 0;
			var nmsp = localStorage.getItem(namespace);
			var index = this.__index = (nmsp == null) ? null : JSON.parse(nmsp);
			if (!index) {
				this.__index = [];
				localStorage.setItem(namespace, "[]");
				localStorage.setItem(namespace + "/version", JSON.stringify(version));
			} else {
				var oldVersion = localStorage.getItem(namespace + "/version");
				if (oldVersion === "undefined") {
					oldVersion = null;
				}
				oldVersion = (oldVersion === null) ? null : JSON.parse(oldVersion);
				version = (version === null) ? null : JSON.parse(version);
				if (oldVersion != version) {
					this.__needUpdate = [oldVersion, version];
				}
			}
		},
		
		members : {
			__namespace : null,
			__index : null,
			__needUpdate : false,
			
			register : function(model) {
			},
			
			open : function(callback) {
				if (this.__needUpdate !== false) {
					var v = this.__needUpdate;
					localStorage.setItem(this.__namespace + "/version", JSON.stringify(v[1]));
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
				callback(this.__index.length);
			},
			
			update : function(entity, callback) {
				var id = entity.id();
				var index = this.__index;
				var namespace = this.__namespace;
				
				localStorage.setItem(namespace + "/d/" + id, entity.toJSONString());
				
				if (index.indexOf(id) < 0) {
					index.push(id);
					localStorage.setItem(namespace, JSON.stringify(index));
				}
				
				callback(id);
			},
			
			remove : function(entity, callback) {
				var id = entity.id();
				var index = this.__index;
				var namespace = this.__namespace;
				
				var pos = index.indexOf(id);
				if (pos >= 0) {
					index.splice(pos, 1);
					localStorage.setItem(namespace, JSON.stringify(index));
					
					localStorage.removeItem(namespace + "/d/" + id);
				}
				
				callback(id);
			},
			
			purge : function(callback) {
				var index = this.__index;
				var namespace = this.__namespace;
				
				var id = index.pop();
				while (id) {
					localStorage.removeItem(namespace + "/d/" + id);
					
					id = index.pop();
				}
				
				localStorage.setItem(namespace, "[]");
				callback();
			},
			
			get : function(id, callback) {
				var index = this.__index;
				var namespace = this.__namespace;
				
				if (index.indexOf(id) < 0) {
					callback(false);
					return;
				}
				
				var item = localStorage.getItem(namespace + "/d/" + id);
				var data = (item == null) ? null : JSON.parse(item);
				
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
				var index = this.__index;
				var namespace = this.__namespace;
				var result = [];
				
				var EntityModel = rearside.Model(meta.name);
				
				for (var i=0,ii=index.length; i<ii; i++) {
					var id = index[i];
					var item = localStorage.getItem(namespace + "/d/" + id);
					var entry = (item == null) ? null : JSON.parse(item);
					
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
	
})(window.localStorage);