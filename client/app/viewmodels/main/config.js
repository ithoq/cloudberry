define(['cloudberry/core', 'knockout'], function(core, ko) {
    console.log("Config route");

    core.views.register({
        parent: 'config',
        route: 'config/users(/:id)',
        moduleId: 'views/main/config/users',
        title: 'Users',
        hash: "#config/users",
        nav: true
    });

    var router = core.routers.get('config');

    /*childRouter.mapUnknownRoutes(function(instruction) {
        console.log("UNKNOWN");
        console.log(instruction);
        //use the instruction to conventionally configure a module
    }).buildNavigationModel();*/

    return {
        router: router
    };
});

define('views/main/config/users', [], function() {
	var model = {};
	
    return {
        activate: function(id) {
            console.log(id);

            return true;
        },
        model: model
    };
});
