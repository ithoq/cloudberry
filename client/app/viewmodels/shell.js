define(['plugins/router', 'cloudberry/session', 'durandal/app'], function(router, session, da) {
    da.on('session:end').then(function() {
        router.navigate('login');
    });

    router.guardRoute = function(instance, instruction) {
        if (instruction.fragment == 'login' && session.get().user)
            return "main";
        
        if (!instance || instruction.fragment == 'login' || session.get().user) {
            return true;
        }
        console.log("UNAUTHORIZED");
        console.log(instance);
        console.log(instruction);

        if (instance.allowUnauthorized) return true;
        return 'login';
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
