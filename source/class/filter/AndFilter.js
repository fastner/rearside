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
	
	core.Class("rearside.filter.AndFilter", {
		construct : function(filter1, filter2) {
			this.__filter1 = filter1;
			this.__filter2 = filter2;
		},
		
		members : {
			__filter1 : null,
			__filter2 : null,
			
			match : function(entity) {
				return this.__filter1.match(entity) && this.__filter2.match(entity);
			},
			
			sql : function() {
				var f1 = this.__filter1.sql();
				var f2 = this.__filter2.sql();
				
				return {
					sql: [f1.sql, f2.sql],
					values: f1.values.concat(f2.values)
				};
			}
		}
	});

})();