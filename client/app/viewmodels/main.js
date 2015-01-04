define(['cloudberry/session', 'cloudberry/core', 'knockout', 'jquery'], function(session, core, ko, $) {
    var _session = session.get();

    /*core.routers.get().on('router:navigation:complete').then(function(instance, instruction, router) {
        console.log("Root nav");
        console.log(instance);
        console.log(instruction);

        var parts = instruction.fragment.split("/");
        var id = parts[0];
        var firstLevelView = core.views.getById(id);
        console.log(firstLevelView);
        if (firstLevelView.parent == 'main') {
            _modules[id] = instance;
        }
    });*/

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
        console.log("Main nav");
        console.log(instance);
        console.log(instruction);

        var parts = instruction.fragment.split("/");
        var firstLevel = parts[0];
        var secondLevel = (parts.length > 1) ? parts[1] : null;

        console.log("active=" + firstLevel + " / " + secondLevel);

        var a = core.views.getById(firstLevel);
        model.activeFirstLevelView(a);
        model.activeSecondLevelView(secondLevel ? core.views.getById(secondLevel) : null);
        model.secondLevelViews(core.views.get(firstLevel) || []);

        if (instruction.config.mainNavTemplate)
            model.subviews({ template: instruction.config.mainNavTemplate, model: instance });
        else
            model.subviews(null);
    });

    return {
        router: router,
        activate: function() {
        },
        core: core,
        model: model,
        getActiveFirstLevelModule: function() {
            //var df = $.Deferred();
            return _activeModule;// _modules[model.activeFirstLevelView().id];
            //return df;
        }
        //onAction: function(ac) {
        //    ac.onAction();
        //}
    };
});
