define(['cloudberry/session', 'cloudberry/core', 'knockout'], function(session, core, ko) {
    var _session = session.get();
    var router = core.routers.get('main');

    core.actions.register({
        type: 'session',
        title: 'logout',
        onAction: function() {
            session.end();
        }
    });

    var model = {
        session: false,
        views: core.views.get('main'),
        secondLevelViews: ko.observableArray([]),
        activeView: false,
        activeSecondLevelView: false
    };

    router.on('router:navigation:complete').then(function(instance, instruction, router) {
        console.log("Main nav");
        console.log(instance);
        console.log(instruction);

        var parts = instruction.fragment.split("/");
        var firstLevel = parts[0];
        var secondLevel = (parts.length > 1) ? parts[1] : null;

        console.log("active=" + firstLevel + " / " + secondLevel);
        model.activeView = core.views.getById(firstLevel);
        model.activeSecondLevelView = secondLevel ? core.views.getById(secondLevel) : null;
        model.secondLevelViews(secondLevel ? core.views.get(firstLevel) : []);
    });

    return {
        router: router,
        activate: function() {
            model.session = session.get();
        },
        core: core,
        model: model,
        //session: session.get(),
        //onAction: function(ac) {
        //    ac.onAction();
        //}
    };
});
