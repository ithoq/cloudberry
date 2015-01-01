define(['plugins/router', 'cloudberry/session'], function(router, session) {
    var _session = session.get();
    var childRouter = router.createChildRouter()
        .map([{
            route: 'files(/:id)',
            moduleId: 'viewmodels/main/files',
            title: 'Files',
            hash: "#files",
            nav: true
        }, {
            route: 'config',
            moduleId: 'viewmodels/main/config',
            title: 'Configuration',
            hash: "#config",
            nav: true
        }]).buildNavigationModel();

    var sessionActions = [{
    	title: 'logout',
    	onAction: function() {
    		session.end();
    	}
    }];
    return {
        router: childRouter,
        session: _session,
        sessionActions: sessionActions,
        onAction: function(ac) {
        	ac.onAction();
        }
    };
});
