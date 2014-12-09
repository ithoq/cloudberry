define(['plugins/router'], function(router) {
    var childRouter = router.createChildRouter()
        .map([{
            route: 'files',
            moduleId: 'viewmodels/main/files',
            title: 'Files',
            hash: "#files",
            nav: true
        }, {
            route: 'config',
            moduleId: 'viewmodels/main/config',
            title: 'Configuration',
            hash: "#config",
            nav: true
        }]).buildNavigationModel();

    return {
        router: childRouter
    };
});
