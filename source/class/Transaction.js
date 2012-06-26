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
				this.__storeProvider.commit(callback, this.__nativeTransaction);
			},
			rollback : function(callback) {
				this.__storeProvider.rollback(callback, this.__nativeTransaction);
			}
		}
	});
	
})();