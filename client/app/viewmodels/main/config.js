define(['cloudberry/core', 'knockout'], function(core, ko) {
	console.log("Config route");
    var router = core.routers.get('config').makeRelative({
            moduleId: 'viewmodels/main/config',
            route: 'config'
        })
        .map([{
            route: 'users',
            moduleId: 'users',
            title: 'Users',
            //hash: "#config/users",
            nav: true
        }]).buildNavigationModel();

    /*childRouter.mapUnknownRoutes(function(instruction) {
        console.log("UNKNOWN");
        console.log(instruction);
        //use the instruction to conventionally configure a module
    }).buildNavigationModel();*/

    return {
        router: router
    };
});
