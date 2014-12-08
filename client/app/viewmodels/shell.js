define(function(require) {
    var router = require('plugins/router');

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
                route: '',
                title: 'Main',
                moduleId: 'viewmodels/main',
                nav: true
            }]).buildNavigationModel();

            return router.activate();
        }
    };
});

define("cloudberry/core", function(require) {

    return {
        foo: "bar"
    }
});