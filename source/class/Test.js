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
	
	var Category = rearside.Model('Category', {
		name: "string",
		metaData: "object"
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
	expect(4);
	
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
	
	var found = false;
	var stores = myTask.getStores();
	for (var i=0,ii=stores.length; i<ii; i++) {
		if (stores[i] === store) {
			found = true;
		}
	}
	ok(found, "Store added to entity");
	
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



QUnit.asyncTest("test query", function() {
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
	
	store.flush(function() {
		// 'not in'
		
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

