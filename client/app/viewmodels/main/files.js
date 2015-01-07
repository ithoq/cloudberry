define(['plugins/router', 'cloudberry/config', 'cloudberry/session', 'cloudberry/filesystem', 'knockout', 'jquery'], function(router, config, session, fs, ko, $) {
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
        onItemAction: function(item, action, ctx) {
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
        }
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

    var onCellClick = function(col, item) {
        parentModel.onItemClick(item);
    };
    var onCellDblClick = function(col, item) {
        parentModel.onItemDblClick(item);
    };
    var onCellRightClick = function(col, item) {
        parentModel.onItemRightClick(item);
        return false;
    };
    return {
        model: null,
        cols: cols,
        activate: function(p) {
            parentModel = p;
            this.model = parentModel.model;
        },
        attached: function(v, p) {
            /*$(v).on('click', '.filelist-item-value', function() {
                var ctx = ko.contextFor(this);
                onCellClick(ctx.col, ctx.item);
            })*/
            $(v).on('contextmenu', '.filelist-item-value', function() {
                var ctx = ko.contextFor(this);
                return onCellRightClick(ctx.col, ctx.item);
            }).find('.filelist-item-value').single_double_click(function(e) {
                //TODO delegate
                var ctx = ko.contextFor(this);
                onCellClick(ctx.col, ctx.item);
            }, function(e) {
                //TODO delegate
                var ctx = ko.contextFor(this);
                onCellDblClick(ctx.col, ctx.item);
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
            parentModel = p;
            this.model = parentModel.model;
            this.large = (parentModel.model.viewType().id == 'icon-large');
        },
        onItemClick: function(item) {
            parentModel.onItemClick(item);
        }
    };
});
