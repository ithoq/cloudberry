define(['plugins/router', 'cloudberry/config', 'cloudberry/session', 'cloudberry/filesystem', 'cloudberry/core', 'knockout', 'jquery'], function(router, config, session, fs, core, ko, $) {
    core.actions.register({
        id: 'filesystem/open',
        type: 'filesystem',
        titleKey: 'core.action.filesystem.open',
        handler: function(item) {
            if (item.is_file) {
                alert("open " + item.name);
                return;
            }
            router.navigate("files/" + item.id);
        }
    });

    core.actions.register({
        id: 'view/details',
        type: 'filesystem',
        titleKey: 'core.action.filesystem.open',
        handler: function(item) {
            alert("details " + item.name);
        }
    });

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
        activeListWidget: null,

        roots: [],
        root: ko.observable(null),
        hierarchy: ko.observableArray([]),
        items: ko.observableArray([]),
        folder: ko.observable(null)
    };
    var onListWidgetReady = function(o) {
        model.activeListWidget = o;
        reload();
    };
    var reload = function() {
    	if (!model.activeListWidget) return;

        var rqData = {};
        if (model.activeListWidget.getRequestData) rqData = model.activeListWidget.getRequestData(model.folderId);
        
        console.log("Files load " + model.folderId);
        fs.folderInfo(model.folderId || 'roots', rqData).then(function(r) {
            model.items(r.items);
            model.root(r.hierarchy ? r.hierarchy[0] : null);
            model.hierarchy((r.hierarchy && r.hierarchy.length > 1) ? r.hierarchy.slice(1) : []);
            model.folder(r.item);
        });
    };
    return {
        activate: function(id) {
            console.log('files activate');

            model.roots = fs.roots();
            model.folderId = id;
            model.root(null);
            model.hierarchy([]);
            model.items([]);
            model.folder(null);
            if (model.activeListWidget) reload();

            return true;
        },
        model: model,
        onItemClick: function(item, e) {
            this.onItemAction(item, "click", e);
        },
        onItemAction: function(item, action, ctx) {
            console.log("item action " + action);
            var itemAction = config["file-view"].actions[action];
            if (!itemAction) return;
            if (typeof(itemAction) == "function") itemAction = itemAction(item);

            console.log(item.name + " " + itemAction);
            if (itemAction == "menu") {
                //$scope.showPopupmenu(ctx.e, item, actions.getType('filesystem', item));
            } else if (itemAction == "quickactions") {
                //$scope.showQuickactions(ctx.e, item, actions.getType('quick', item));
            } else if (itemAction == "details") {
                //$scope.showItemDetails(item);
            } else {
                core.actions.trigger(itemAction, item);
            }
        },
        setViewType: function(v) {
            model.viewType(v);
        },
        onListWidgetReady: onListWidgetReady
    };
});

define('main/files/list', ['knockout'], function(ko) {
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

    var getCtx = function() {
        return {};
    };
    var onCellClick = function(col, item) {
        parentModel.onItemAction(item, "click", getCtx());
    };
    var onCellDblClick = function(col, item) {
        parentModel.onItemAction(item, "dbl-click", getCtx());
    };
    var onCellRightClick = function(col, item) {
        parentModel.onItemAction(item, "right-click", getCtx());
        return false;
    };
    var getRequestData = function() {
        console.log('file list rq');
        return {
            foo: "bar"
        };
    };
    return {
        model: null,
        cols: cols,
        activate: function(p) {
            console.log('files list activate');

            parentModel = p;
            this.model = parentModel.model;

            parentModel.onListWidgetReady({
                getRequestData: getRequestData
            });
        },
        attached: function(v, p) {
            var clicks = 0,
                clickElement = null;
            /*$(v).on('click', '.filelist-item-value', function() {
                var ctx = ko.contextFor(this);
                onCellClick(ctx.col, ctx.item);
            })*/
            $(v).on('click', '.filelist-item-value', function() {
                if (!clickElement || clickElement != this) clicks = 0;
                var ctx = ko.contextFor(this);
                //onCellClick(ctx.col, ctx.item);
                clicks++;
                clickElement = this;

                if (clicks == 1) {
                    setTimeout(function() {
                        if (clicks == 1) {
                            onCellClick(ctx.col, ctx.item);
                        } else {
                            onCellDblClick(ctx.col, ctx.item);
                        }
                        clicks = 0;
                    }, 300);
                }
            }).on('contextmenu', '.filelist-item-value', function() {
                var ctx = ko.contextFor(this);
                return onCellRightClick(ctx.col, ctx.item);
            });
        },
        getCell: function(col, item) {
            return col.content(item);
        }
    };
});

define('main/files/icon', function() {
    var parentModel = null;

    return {
        model: null,
        large: false,
        activate: function(p) {
            console.log('files icon list activate');

            parentModel = p;
            this.model = parentModel.model;
            this.large = (parentModel.model.viewType().id == 'icon-large');

            parentModel.onListWidgetReady({});
        },
        onItemClick: function(item) {
            parentModel.onItemClick(item);
        }
    };
});
