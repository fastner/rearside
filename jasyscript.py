
NAMESPACE = "rearside.Test"

@task("Clean")
def clean():
	session.clean()


@task("Distclean")
def distclean():
	session.clean()
	removeDir("build")
	removeDir("source/script")


@task("Build")
def build():
	assetManager.addBuildProfile()
	assetManager.deploy(Resolver().addClassName(NAMESPACE).getIncludedClasses())
	kernelClasses = storeKernel("script/kernel.js")

	sortedClasses = Resolver().addClassName(NAMESPACE).excludeClasses(kernelClasses).getSortedClasses()
	storeCompressed(sortedClasses, "script/main.js")
	copyFile("source/index.html", "index.html")


@task("Source")
def source():
	jsFormatting.enable("comma")
	jsFormatting.enable("semicolon")
	jsOptimization.disable("privates")
	jsOptimization.disable("variables")
	jsOptimization.disable("declarations")
	jsOptimization.disable("blocks")
	
	assetManager.addSourceProfile()
	resolver = Resolver().addClassName(NAMESPACE)
	
	kernelClasses = storeKernel("script/kernel.js")

	sortedClasses = Resolver().addClassName(NAMESPACE).excludeClasses(kernelClasses).getSortedClasses()
	storeLoader(sortedClasses, "script/main.js")
	