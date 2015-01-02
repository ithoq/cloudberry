define(['plugins/router', 'cloudberry/session', 'cloudberry/filesystem', 'knockout'], function(router, session, fs, ko) {
    var model = {
    	hierarchy: ko.observableArray([]),
        items: ko.observableArray([])
    };
    return {
        activate: function(id) {
            console.log(id);
            //if (!id) {
            //	model.items(session.folders);
            //} else {
            //TODO request data

            //var folder = itemRepository.getItem
            fs.folderInfo(id || 'roots').then(function(r) {
                model.items(r.items);
                model.hierarchy(r.hierarchy);
            });
            //
            return true;
        },
        model: model,
        onItemClick: function(item, e) {
        	router.navigate("files/"+item.id);
        }
    };
});
