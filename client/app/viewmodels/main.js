define(['cloudberry/session', 'cloudberry/core'], function(session, core) {
    var _session = session.get();
    var router = core.routers.get('main');

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
