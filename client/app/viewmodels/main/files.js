define(['plugins/router', 'cloudberry/session', 'cloudberry/filesystem', 'knockout'], function(router, session, fs, ko) {
    var model = {
    	roots: [],
    	root: ko.observable(null),
    	hierarchy: ko.observableArray([]),
        items: ko.observableArray([]),
        folder: ko.observable(null)
    };
    return {
        activate: function(id) {
            model.roots = fs.roots();

            fs.folderInfo(id || 'roots').then(function(r) {
                model.items(r.items);
                model.root(r.hierarchy ? r.hierarchy[0] : null);
                model.hierarchy((r.hierarchy && r.hierarchy.length > 1) ? r.hierarchy.slice(1) : []);
                model.folder(r.item);
            });

            return true;
        },
        model: model,
        onItemClick: function(item, e) {
        	router.navigate("files/"+item.id);
        }
    };
});
