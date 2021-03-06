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

/**
 * #asset(qunit-xyz.css)
 */
var uri = jasy.Asset.toUri("qunit-xyz.css");
core.io.StyleSheet.load(uri);

localStorage.clear();

var testProvider = [rearside.provider.Memory, rearside.provider.LocalStorage];

if (window.openDatabase) {
	testProvider.push(rearside.provider.WebSql);
	console.log("FOUND WebSql");
}

testProvider.forEach(function(StoreProviderCls) {

	QUnit.module(StoreProviderCls);

	QUnit.test("create memory store provider", function() {
		var storeProvider = new StoreProviderCls("a");
		
		ok(!!storeProvider, "Create memory store provider");
	});
	
	
	
	
	QUnit.test("create store", function() {
		var storeProvider = new StoreProviderCls("b");
		
		var store = new rearside.Store(storeProvider);
		ok(!!store, "Create store");
		
		ok(store.getStoreProvider() == storeProvider, "Storeprovider is set");
	});
	
	
	
	
	QUnit.test("create model", function() {
		var Task = rearside.Model('Task', {
			name: "string",
			description: "string",
			done: "boolean"
		});
	
		ok(!!Task, "Model created");
		
		var myTask = new Task({
			name: "My test"
		});
		ok(!!myTask, "Object from model created");
		
		ok(myTask.get("name") == "My test", "Config parameter is set on model object");
		
		myTask.set("name", "Next step");
		ok(myTask.get("name") == "Next step", "Config parameter is set on model object");
		ok(myTask.isDirty(), "Entity object has dirty data set");
		ok (myTask.dirtyProperties().indexOf("name") >= 0, "Name is marked as dirty");
		
		//ok(store.getQueue().indexOf(myTask) >= 0, "Entity object queued in store");
		
		var myNextTask = new Task({
			id: 123
		});
		ok(myNextTask.id() == 123, "Check if id field is set");
		
		//ok(myNextTask.getStore() == store, "Check if store is set");
	});

	
	QUnit.asyncTest("use model", function() {
		expect(5);
		
		var storeProvider = new StoreProviderCls("c");
		var store = new rearside.Store(storeProvider);
		
		store.open(function() {
	
			var Task2 = rearside.Model('Task2', {
				name: "string",
				description: "string",
				done: "boolean"
			});
			
			store.register(Task2);
			
			var myTask = new Task2({
				name: "My test"
			});
			
			store.add(myTask);
			
			ok(myTask.equals(myTask), "Test equals function");
			
			ok(myTask.getStore() == store, "Store added to entity");
			store.flush(function() {
				storeProvider.countAllEntities(function(entries) {
					ok(entries == 1, "One entity in store provider");
					store.get(myTask.id(), function(loadedEntity) {
						ok (loadedEntity.get("name") == myTask.get("name"), "Loaded entity has same name property");
						store.remove(loadedEntity);
						store.flush(function() {
							storeProvider.countAllEntities(function(entries) {
								ok(entries == 0, "Remove entity from store provider");
								start();
							});
						});
					});
				});
			
			});
		
		});
		
	});
	
	
	QUnit.asyncTest("test simple queries", function() {
		expect(9);
		
		var storeProvider = new StoreProviderCls("d");
		var store = new rearside.Store(storeProvider);
		
		store.open(function() {
	
			var Task = rearside.Model('Task3', {
				name: "string",
				description: "string",
				done: "boolean",
				count: "number"
			});
			
			store.register(Task);
			
			var myTask = new Task({
				id: "test simple query id 1",
				name: "My test",
				count: 25
			});
			
			store.add(myTask);
			
			store.flush(function() {
				
				Task.query(store).filter("name", "contains", "test").list(function(results) {
					
					equal(results.length, 1, "Found 'contains' entry");
					start();
					
				});
				
				Task.query(store).filter("name", "contains not", "abc").list(function(results) {
					
					equal(results.length, 1, "Found 'contains not' entry");
					start();
					
				});
				
				Task.query(store).filter("name", "=", "My test").list(function(results) {
					
					equal(results.length, 1, "Found '=' entry");
					start();
					
				});
				
				Task.query(store).filter("name", "!=", "abc").list(function(results) {
					
					equal(results.length, 1, "Found '!=' entry");
					start();
					
				});
				
				Task.query(store).filter("count", "<", 50).list(function(results) {
					
					equal(results.length, 1, "Found '<' entry");
					start();
					
				});
				
				Task.query(store).filter("count", ">", 2).list(function(results) {
					
					equal(results.length, 1, "Found '>' entry");
					start();
					
				});
				
				Task.query(store).filter("count", "<=", 25).list(function(results) {
					
					equal(results.length, 1, "Found '<=' entry");
					start();
					
				});
				
				Task.query(store).filter("count", ">=", 25).list(function(results) {
					
					equal(results.length, 1, "Found '>=' entry");
					start();
					
				});
				
				Task.query(store).filter("name", "contains", "test").filter("count", ">=", 25).list(function(results) {
					
					equal(results.length, 1, "Found 'contains' and '>=' entry");
					start();
					
				});
				
			});
		
		});
	});
	
	
	QUnit.asyncTest("test and/or queries", function() {
		expect(3);
		
		var storeProvider = new StoreProviderCls("e");
		var store = new rearside.Store(storeProvider);
		
		store.open(function() {
	
			var Task = rearside.Model('Task4', {
				name: "string",
				description: "string",
				done: "boolean",
				count: "number"
			});
			
			store.register(Task);
			
			var myTask = new Task({
				id: "test and or queries id 2",
				name: "My test",
				count: 25
			});
			
			store.add(myTask);
			
			store.flush(function() {
				
				var f1 = new rearside.filter.PropertyFilter("count", "=", 25);
				Task.query(store).filter("name", "contains", "test").and(f1).list(function(results) {
					
					ok(results.length == 1, "true and true");
					start();
					
				});
				
				Task.query(store).filter("name", "contains", "abc").and(f1).list(function(results) {
					
					ok(results.length == 0, "false and true");
					start();
					
				});
				
				Task.query(store).filter("name", "contains", "abc").or(f1).list(function(results) {
					
					ok(results.length == 1, "false or true");
					start();
					
				});
				
			});
		
		});
	});
	
	
	QUnit.asyncTest("test other modifications queries", function() {
		expect(7);
		
		var storeProvider = new StoreProviderCls("f");
		var store = new rearside.Store(storeProvider);
		
		store.open(function() {
	
			var Task = rearside.Model('Task5', {
				name: "string",
				count: "number"
			});
			
			store.register(Task);
			
			var myTask;
			for (var i=0; i<15; i++) {
				myTask = new Task({
					id: "test and or queries id " + i,
					name: "My test " + i,
					count: i
				});
				
				store.add(myTask);
			}
			
			store.flush(function() {
				
				Task.query(store).order("count").limit(5).list(function(r) {
					
					equal(r.length, 5, "Query 5 results");
					ok(r[0].get("count") === 0 && r[1].get("count") == 1 && r[2].get("count") == 2 && r[3].get("count") == 3 && r[4].get("count") == 4, "Right order");
					
					start();
					
				});
				
				Task.query(store).order("count", "desc").limit(5).list(function(r) {
					
					equal(r.length, 5, "Query 5 results");
					ok(r[0].get("count") === 14 && r[1].get("count") == 13 && r[2].get("count") == 12 && r[3].get("count") == 11 && r[4].get("count") == 10, "Right order desc");
					
					start();
					
				});
				
				Task.query(store).order("count").limit(5).skip(5).list(function(r) {
					
					equal(r.length, 5, "Query 5 results");
					ok(r[0].get("count") === 5 && r[1].get("count") == 6 && r[2].get("count") == 7 && r[3].get("count") == 8 && r[4].get("count") == 9, "Right order with skip");
					
					start();
					
				});
				
				Task.query(store).order("count", "desc").one(function(r) {
					
					ok(r != null, "Query one results");
					start();
					
				});
				
			});
		
		});
	});
	
	QUnit.asyncTest("test has one and has many", function() {
		expect(4);
		
		var storeProvider = new StoreProviderCls("g");
		var store = new rearside.Store(storeProvider);
		
		store.open(function() {
	
			var User = rearside.Model('User', {
				name: "string"
			});
		
			var Task = rearside.Model('Task6', {
				name: "string",
				owner: User
			});
			
			var Category = rearside.Model('Category6', {
				name: "string"
			});
			
			store.register(User);
			store.register(Task);
			store.register(Category);
			
			Category.hasMany("tasks", Task);
			
			var user1 = new User({
				name: "Testuser"
			});
			var task0 = new Task({
				name: "My task 0"
			});
			var task1 = new Task({
				name: "My task 1"
			});
			var task2 = new Task({
				name: "My task 2"
			});
			var cat1 = new Category({
				name: "Testcategory"
			});
			
			
			store.add(user1);
			store.add(task0);
			store.add(task1);
			store.add(task2);
			store.add(cat1);
			
			cat1.set("tasks", [task1, task2]);
			task0.set("owner", user1);
			
			store.flush(function() {
				
				var tasks = cat1.get("tasks");
				//ok((tasks[0] === task1.id() && tasks[1] === task2.id()) || (tasks[0] === task2.id() && tasks[1] === task1.id()), "Not fetched tasks are equals to task entity ids");
				ok(tasks instanceof rearside.Query, "One to many returns query collection");
				
				tasks.list(function(result) {
					ok (result.length == 2, "2 results found");
					ok( (result[0].equals(task1) && result[1].equals(task2)) || (result[0].equals(task2) && result[1].equals(task1)), "Check if loaded entities equals saved ones");
					start();
				});
				Task.query(store).find([task0.id()]).one(function(entity) {
					
					entity.get("owner").one(function(entity) {
						ok(entity.equals(user1), "Owner equals original set owner");
					});
					
				});
				
			});
		
		});
	});
	
	
	
	
	QUnit.asyncTest("permanent local storage", function() {
		expect(2);
		
		var store = new rearside.Store(new StoreProviderCls("test1"));
		var store2 = new rearside.Store(new StoreProviderCls("test2"));
		
		store.open(function() {
			store2.open(function() {
	
				var Task7 = rearside.Model('Task7', {
					name: "string",
					count: "number"
				});
				
				store.register(Task7);
				store2.register(Task7);
				
				var myTask = new Task7({
					name: "Storage test",
					count: 4
				});
				
				store.add(myTask);
				
				store.flush(function() {
					
					store.get(myTask.id(), function(loadedEntity) {
						ok (myTask.equals(loadedEntity), "Loaded entity is equal");
						start();
					});
					
					store2.get(myTask.id(), function(loadedEntity) {
						ok (!myTask.equals(loadedEntity), "Entity not in other store");
						start();
					});
				
				});
		
			});
		});
		
	});
	
	
	
	QUnit.asyncTest("version update", function() {
		expect(2);
		
		var store = new rearside.Store(new StoreProviderCls("test3", 1));
		store.open(function(){
		
			store = new rearside.Store(new StoreProviderCls("test3",1 ));
			store.open(function(needUpdate) {
				ok(!needUpdate, "No updates needed");
				start();
				
				store = new rearside.Store(new StoreProviderCls("test3", 2));
				store.open(function(needUpdate) {
					ok(needUpdate, "Updates needed due to new version number");
					start();
				});
				
			});
		
		});
		
	});
	
	
	QUnit.asyncTest("purge local storage", function() {
		expect(3);
		
		var store = new rearside.Store(new StoreProviderCls("test4"));
		var store2 = new rearside.Store(new StoreProviderCls("test5"));
		
		store.open(function() {
			store2.open(function() {
	
				var Task = rearside.Model('Task8', {
					name: "string"
				});
				
				store.register(Task);
				store2.register(Task);
				
				var myTask = new Task({
					name: "Storage test 1"
				});
				store.add(myTask);
				
				var myTask2 = new Task({
					name: "Storage test 2"
				});
				store2.add(myTask2);
				
				store.flush(function() {
					
					store2.flush(function() {
				
						store.get(myTask.id(), function(loadedEntity) {
				
							ok (myTask.equals(loadedEntity), "Loaded entity is equal");
							
							store.purge(function() {
					
								store.get(myTask.id(), function(loadedEntity) {
									ok (!loadedEntity, "Store 1 purged");
									start();
								});
								
								store2.get(myTask2.id(), function(loadedEntity) {
									ok (myTask2.equals(loadedEntity), "Entity2 still in store");
									start();
								});
							
							});
						
						});
					
					});
					
				
				});
				
			});
		});
		
	});

});