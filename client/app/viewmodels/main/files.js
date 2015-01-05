define(['plugins/router', 'cloudberry/session', 'cloudberry/filesystem', 'knockout'], function(router, session, fs, ko) {
    var viewTypes = [{
        id: 'list',
        icon: 'fa-list',
        module: 'main/files/list',
        template: 'views/main/files/list'
    }, {
        id: 'icon-small',
        icon: 'fa-th',
        module: 'main/files/icon',
        template: 'views/main/files/icon'
    }, {
        id: 'icon-large',
        icon: 'fa-th-large',
        module: 'main/files/icon',
        template: 'views/main/files/icon'
    }];
    var model = {
        viewTypes: viewTypes,
        viewType: ko.observable(viewTypes[0]),

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
            if (item.is_file) return;
            router.navigate("files/" + item.id);
        },
        setViewType: function(v) {
            model.viewType(v);
        }
    };
});

define('main/files/list', function() {
	var parentModel = null;
    var cols = [{
        id: 'name',
        title: 'Name',
        content: function(item) {
            return item.name;
        }
    }, {
        id: 'extension',
        title: 'Extension',
        content: function(item) {
            return item.extension;
        }
    }];

    return {
        model: null,
        cols: cols,
        activate: function(p) {
        	parentModel = p;
            this.model = parentModel.model;
        },
        getCell: function(col, item) {
            return col.content(item);
        },
        onCellClick: function(col, item) {
        	parentModel.onItemClick(item);
        }
    };
});

define('main/files/icon', function() {
    return {
        model: null,
        large: false,
        activate: function(m) {
            this.model = m;
            this.large = (m.viewType().id == 'icon-large');
        }
    };
});
