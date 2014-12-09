define(['plugins/router', 'cloudberry/session'], function(router, session) {
    router.guardRoute = function(instance, instruction) {
        if (!instance || instruction.fragment == 'login' || session.get().user) {
            return true;
        }
        console.log("UNAUTHORIZED");
        console.log(instance);
        console.log(instruction);

        if (instance.allowUnauthorized) return true;
        return 'login/' + instruction.fragment;
    };

    return {
        router: router,
        activate: function() {
            router.map([{
                route: 'login',
                title: '',
                moduleId: 'viewmodels/login'
            }, {
                route: '*details',
                title: '',
                moduleId: 'viewmodels/main',
                nav: true
            }]).buildNavigationModel();

            return router.activate();
        }
    };
});
