define(['plugins/router'], function(router) {
    router.guardRoute = function(instance, instruction) {
        console.log("guard");
        console.log(instance);
        console.log(instruction);

        /*if (user.isAuthenticated()) {
            return true;
        } else {
            if (instance && typeof(instance.preventAnonymous) === "boolean") {
                if (instance.preventAnonymous) {
                    return 'login/' + instruction.fragment;
                }
            }

            return true;
        }*/

        return true;
    };

    return {
        router: router,
        activate: function() {
            router.map([{
                route: 'login',
                title: '',
                moduleId: 'viewmodels/login',
                nav: true
            }, {
                route: '',
                title: '',
                moduleId: 'viewmodels/main',
                nav: true
            }]).buildNavigationModel();

            return router.activate();
        }
    };
});
