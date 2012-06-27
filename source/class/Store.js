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
		},
		
		members : {
			__dirty : null,
			__remove : null,
			__storeProvider : null,
			
			getStoreProvider : function() {
				return this.__storeProvider;
			},
			
			transaction : function(callback) {
				this.__storeProvider.transaction(callback);
			},
			
			queue : function(entity) {
				this.__dirty.push(entity);
			},
			
			getQueue : function() {
				return this.__dirty.slice();
			},
			
			add : function(entity) {
				if (!entity.setStore(this)) {
					throw new Error("You are not allowed to set more than one store");
				}
			},
			
			remove : function(entity) {
				if (entity.removeStore(this)) {
					this.__remove.push(entity);
				}
			},
			
			get : function(tx, id, callback) {
				var store = this;
				this.__storeProvider.get(id, function(entity) {
					if (entity) {
						entity.setStore(store);
					}
					callback(entity);
				});
			},
			
			flush : function(tx, callback) {
				var todo = 1;
				
				var cb = function() {
					todo--;
					
					if (todo == 0) callback();
				};
				
				var entity = this.__dirty.pop();
				while (entity) {
					todo++;
					this.__storeProvider.update(entity, cb)
					entity = this.__dirty.pop();
				}
				
				entity = this.__remove.pop();
				while (entity) {
					todo++;
					this.__storeProvider.remove(entity, cb);
					entity = this.__dirty.pop();
				}
				
				todo--;
				if (todo == 0) callback();
			},
			
			query : function(callback, meta, filter, idFilter, limit, skip, order) {
				var store = this;
				this.__storeProvider.query(function(result) {
					for (var i=0,ii=result.length; i<ii; i++) {
						result[i].setStore(store);
					}
					callback(result);
				}, meta, filter, idFilter, limit, skip, order);
			},
			
			count : function(callback, meta, filter, idFilter, limit, skip, order) {
				this.__storeProvider.count(callback, meta, filter, idFilter, limit, skip, order);
			}
		}
	});
	
})();