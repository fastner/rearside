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
core.io.Asset.load(["qunit-xyz.css"]);


QUnit.module("StoreProvider");

QUnit.test("create memory store provider", function() {
	var storeProvider = new rearside.provider.Memory();
	
	ok(!!storeProvider, "Create memory store provider");
});




QUnit.module("Store");

QUnit.test("create store", function() {
	var storeProvider = new rearside.provider.Memory();
	
	var store = new rearside.Store(storeProvider);
	ok(!!store, "Create store");
	
	ok(store.getStoreProvider() == storeProvider, "Storeprovider is set");
});




QUnit.module("Model");

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


QUnit.asyncTest("use model with transaction", function() {
	expect(5);
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

	var Task2 = rearside.Model('Task2', {
		name: "string",
		description: "string",
		done: "boolean"
	});
	
	var myTask = new Task2({
		name: "My test"
	});
	
	store.add(myTask);
	
	ok(myTask.equals(myTask), "Test equals function");
	
	ok(myTask.getStore() == store, "Store added to entity");
	
	store.transaction(function(tx) {
	
		store.flush(tx, function() {
			storeProvider.countAllEntities(tx, function(entries) {
				ok(entries == 1, "One entity in store provider");
				store.get(tx, myTask.id(), function(loadedEntity) {
					ok (loadedEntity.get("name") == myTask.get("name"), "Loaded entity has same name property");
					store.remove(loadedEntity);
					store.flush(tx, function() {
						storeProvider.countAllEntities(tx, function(entries) {
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
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

	var Task = rearside.Model('Task3', {
		name: "string",
		description: "string",
		done: "boolean",
		count: "number"
	});
	
	var myTask = new Task({
		name: "My test",
		count: 25
	});
	
	store.add(myTask);
	
	store.transaction(function(tx) {
		store.flush(tx, function() {
			
			Task.query(store).filter("name", "contains", "test").list(function(results) {
				
				ok(results.length == 1, "Found 'contains' entry");
				start();
				
			});
			
			Task.query(store).filter("name", "contains not", "abc").list(function(results) {
				
				ok(results.length == 1, "Found 'contains not' entry");
				start();
				
			});
			
			Task.query(store).filter("name", "=", "My test").list(function(results) {
				
				ok(results.length == 1, "Found '=' entry");
				start();
				
			});
			
			Task.query(store).filter("name", "!=", "abc").list(function(results) {
				
				ok(results.length == 1, "Found '!=' entry");
				start();
				
			});
			
			Task.query(store).filter("count", "<", 50).list(function(results) {
				
				ok(results.length == 1, "Found '<' entry");
				start();
				
			});
			
			Task.query(store).filter("count", ">", 2).list(function(results) {
				
				ok(results.length == 1, "Found '>' entry");
				start();
				
			});
			
			Task.query(store).filter("count", "<=", 25).list(function(results) {
				
				ok(results.length == 1, "Found '<=' entry");
				start();
				
			});
			
			Task.query(store).filter("count", ">=", 25).list(function(results) {
				
				ok(results.length == 1, "Found '>=' entry");
				start();
				
			});
			
			Task.query(store).filter("name", "contains", "test").filter("count", ">=", 25).list(function(results) {
				
				ok(results.length == 1, "Found 'contains' and '>=' entry");
				start();
				
			});
			
		});
	});
});


QUnit.asyncTest("test and/or queries", function() {
	expect(3);
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

	var Task = rearside.Model('Task4', {
		name: "string",
		description: "string",
		done: "boolean",
		count: "number"
	});
	
	var myTask = new Task({
		name: "My test",
		count: 25
	});
	
	store.add(myTask);
	
	store.transaction(function(tx) {
	
		store.flush(tx, function() {
			
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
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

	var Task = rearside.Model('Task5', {
		name: "string",
		count: "number"
	});
	
	var myTask;
	for (var i=0; i<15; i++) {
		myTask = new Task({
			name: "My test " + i,
			count: i
		});
		
		store.add(myTask);
	}
	
	store.transaction(function(tx) {
	
		store.flush(tx, function() {
			
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
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

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
	
	store.transaction(function(tx) {
	
		store.flush(tx, function() {
			
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
	
	var store = new rearside.Store(new rearside.provider.LocalStorage("test1"));
	var store2 = new rearside.Store(new rearside.provider.LocalStorage("test2"));

	var Task7 = rearside.Model('Task7', {
		name: "string",
		count: "number"
	});
	
	var myTask = new Task7({
		name: "Storage test",
		count: 4
	});
	
	store.add(myTask);
	
	store.transaction(function(tx) {
	
		store.flush(tx, function() {
			
			store.transaction(function(tx2) {
				
				store.get(tx2, myTask.id(), function(loadedEntity) {
					ok (myTask.equals(loadedEntity), "Loaded entity is equal");
					start();
				});
				
			});
			
			store2.transaction(function(tx2) {
				store2.get(tx2, myTask.id(), function(loadedEntity) {
					ok (!myTask.equals(loadedEntity), "Entity not in other store");
					start();
				});
			});
		
		});
	
	});
	
});
