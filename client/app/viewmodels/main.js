define(['cloudberry/session', 'cloudberry/core', 'knockout', 'jquery'], function(session, core, ko, $) {
    var router = core.routers.get('main');

    core.actions.register({
        type: 'session',
        title: 'logout',
        onAction: function() {
            session.end();
        }
    });

    var model = {
        session: session.get(),

        activeFirstLevelView: ko.observable(null),
        firstLevelViews: ko.observableArray(core.views.get('main')),

        activeSecondLevelView: ko.observable(null),
        secondLevelViews: ko.observableArray([]),

        subviews: ko.observable(null)
    };

    router.on('router:navigation:complete').then(function(instance, instruction, router) {
        var parts = instruction.fragment.split("/");
        var firstLevel = parts[0];
        var secondLevel = (parts.length > 1) ? parts[1] : null;

        console.log("active=" + firstLevel + " / " + secondLevel);

        model.activeFirstLevelView(core.views.getById(firstLevel));
        model.activeSecondLevelView(secondLevel ? core.views.getById(secondLevel) : null);
        model.secondLevelViews(core.views.get(firstLevel) || []);

        if (instruction.config.subViewTemplates)
            model.subviews({ templates: instruction.config.subViewTemplates, model: instance });
        else
            model.subviews(null);
    });

    return {
        router: router,
        activate: function() {
        },
        core: core,
        model: model
        //onAction: function(ac) {
        //    ac.onAction();
        //}
    };
});
