/**
 * #asset(qunit-xyz.css)
 */
core.io.Asset.load(["qunit-xyz.css"]);




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
});
