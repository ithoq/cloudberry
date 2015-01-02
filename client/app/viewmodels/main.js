define(['cloudberry/session', 'cloudberry/core'], function(session, core) {
    var _session = session.get();
    var router = core.routers.main()
        .map([{
            route: 'files(/:id)',
            moduleId: 'viewmodels/main/files',
            title: 'Files',
            hash: "#files",
            nav: true
        }, {
            route: 'config*details',
            moduleId: 'viewmodels/main/config',
            title: 'Configuration',
            hash: "#config",
            nav: true
        }]).buildNavigationModel();

    core.actions.register({
        type: 'session',
        title: 'logout',
        onAction: function() {
            session.end();
        }
    });

    return {
        router: router,
        session: _session,
        sessionActions: core.actions.get('session'),
        onAction: function(ac) {
            ac.onAction();
        }
    };
});
