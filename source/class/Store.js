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

	core.Class("rearside.Store", {
		construct : function(storeProvider) {
			if (core.Env.getValue("debug")) {
				if (!storeProvider) {
					throw new Error("No store provider set");
				}
			}
			
			this.__dirty = [];
			this.__remove = [];
			this.__storeProvider = storeProvider;
			
			this.__models = [];
		},
		
		members : {
			__dirty : null,
			__remove : null,
			__storeProvider : null,
			__models : null,
			
			register : function(model) {
				var name = model.getName();
				var models = this.__models;
				
				if (models.indexOf(name) < 0) {
					this.__storeProvider.register(model);
					models.push(name);
				}
			},
			
			open : function(callback) {
				this.__storeProvider.open(callback);
			},
			
			getStoreProvider : function() {
				return this.__storeProvider;
			},
			
			queue : function(entity) {
				this.__dirty.push(entity);
			},
			
			getQueue : function() {
				return this.__dirty.slice();
			},
			
			__checkEntityIsRegistered : function(entity) {
				var name = entity.getType();
				if (this.__models.indexOf(name) < 0) {
					throw new Error("Model " + name + " not registered in store");
				}
			},
			
			add : function(entity) {
				if (core.Env.getValue("debug")) {
					this.__checkEntityIsRegistered(entity);
				}
				if (!entity.setStore(this)) {
					throw new Error("You are not allowed to set more than one store");
				}
			},
			
			remove : function(entity) {
				if (core.Env.getValue("debug")) {
					this.__checkEntityIsRegistered(entity);
				}
				if (entity.removeStore(this)) {
					this.__remove.push(entity);
				}
			},
			
			get : function(id, callback) {
				var store = this;
				this.__storeProvider.get(id, function(entity) {
					if (entity) {
						entity.setStore(store);
					}
					callback && callback(entity);
				});
			},
			
			flush : function(callback) {
				var todo = 1;
				
				var cb = function(doo, id) {
					todo--;

					if (callback && todo == 0) {
						callback();
					}
				};
				
				for (var i=0,ii=this.__remove.length; i<ii; i++) {
					var r = this.__remove[i];
					for (var j=0,jj=this.__dirty.length; j<jj; j++) {
						var u = this.__dirty[j];
						if (r.id() == u.id()) {
							this.__dirty.splice(j, 1);
							break;
						}
					}
				}
				
				var entity = this.__dirty.shift();
				while (entity) {
					todo++;
					
					if (core.Env.getValue("debug")) {
						this.__checkEntityIsRegistered(entity);
					}
					
					this.__storeProvider.update(entity, cb);
					entity = this.__dirty.shift();
				}
				
				entity = this.__remove.shift();
				while (entity) {
					todo++;
					
					this.__storeProvider.remove(entity, cb);
					entity = this.__remove.shift();
				}

				todo--;
				if (callback && todo == 0) {
					callback();
				}
			},
			
			purge : function(callback) {
				this.__storeProvider.purge(callback);
			},
			
			query : function(callback, meta, filter, idFilter, limit, skip, order) {
				var store = this;
				this.__storeProvider.query(function(result) {
					for (var i=0,ii=result.length; i<ii; i++) {
						result[i].setStore(store);
					}
					callback && callback(result);
				}, meta, filter, idFilter, limit, skip, order);
			},
			
			count : function(callback, meta, filter, idFilter, limit, skip, order) {
				this.__storeProvider.count(callback, meta, filter, idFilter, limit, skip, order);
			}
		}
	});
	
})();
