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
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);
	
	var myTask = new Task(store, {
		name: "My test"
	});
	ok(!!myTask, "Object from model created");
	
	ok(myTask.get("name") == "My test", "Config parameter is set on model object");
	
	myTask.set("name", "Next step");
	ok(myTask.get("name") == "Next step", "Config parameter is set on model object");
	ok(myTask.isDirty(), "Entity object has dirty data set");
	ok (myTask.dirtyProperties().indexOf("name") >= 0, "Name is marked as dirty");
	
	ok(store.getQueue().indexOf(myTask) >= 0, "Entity object queued in store");
	
	var myNextTask = new Task(store, {
		id: 123
	});
	ok(myNextTask.id() == 123, "Check if id field is set");
	
	ok(myNextTask.getStore() == store, "Check if store is set");
});

QUnit.test("use model", function() {
	
	var storeProvider = new rearside.provider.Memory();
	var store = new rearside.Store(storeProvider);

	var Task = rearside.Model('Task', {
		name: "string",
		description: "string",
		done: "boolean"
	});
	
	var myTask = new Task(store, {
		name: "My test"
	});
	
	store.add(myTask);
	store.remove(myTask);
	store.flush();
});