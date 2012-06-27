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

	core.Class("rearside.Transaction", {
		construct : function(storeProvider, nativeTransaction) {
			if (core.Env.getValue("debug")) {
				if (!storeProvider) {
					throw new Error("No store provider set");
				}
			}
			
			this.__storeProvider = storeProvider;
			this.__nativeTransaction = nativeTransaction;
		},
		
		members : {
			__storeProvider : null,
			__nativeTransaction : null,
			
			commit : function(callback) {
				this.__storeProvider.commit(this.__nativeTransaction, callback);
			},
			rollback : function(callback) {
				this.__storeProvider.rollback(this.__nativeTransaction, callback);
			}
		}
	});
	
})();