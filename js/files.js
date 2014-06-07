! function(cloudberry) {
    'use strict';

    cloudberry.modules.push({
        id: 'cloudberry.main.files',

        setup: function(h, mod, gettext) {
            var viewData = {
                type: 1
            };

            gettext("files_viewTitle");
            h.registerView('files', {
                titleKey: "files_viewTitle",
                icon: "fa-folder",
                parent: "main",
                url: "^/files/{id}",
                template: "files.html",
                controller: "FilesCtrl",
                redirect: ['filesystem',
                    function(to, filesystem) {
                        if (to.location && to.location.$$path == '/files') {
                            var roots = filesystem.roots();
                            if (!roots || roots.length === 0) return;

                            var rd = "/files/" + roots[0].id;
                            console.log("PATH:" + to.location.$$path + " -> " + rd);
                            return rd;
                        }
                    }
                ],
                resolve: {
                    data: function($stateParams, filesystem) {
                        return filesystem.folderInfo($stateParams.id, true); //TODO request data
                    }
                },
                subviews: {
                    'header-nav': {
                        template: 'files-header-nav.html'
                    },
                    'header-tools': {
                        template: 'files-header-tools.html'
                    },
                    'sidebar': {
                        template: 'files-sidebar.html'
                    },
                    'files@files': {
                        template: function() {
                            if (viewData.type == 1)
                                return 'files-list-table.html';
                            else if (viewData.type == 2 || viewData.type == 3)
                                return 'files-list-icon.html';
                        },
                        controller: function() {
                            if (viewData.type == 1)
                                return 'FilesListTableCtrl';
                            else if (viewData.type == 2 || viewData.type == 3)
                                return 'FilesListIconCtrl';
                        }
                    }
                }
            });

            mod.controller('FilesCtrl', ['$scope', '$state', '$stateParams', 'settings', 'actions', 'filesystem', 'data',
                function($scope, $state, $stateParams, settings, actions, filesystem, data) {
                    var reload = function() {
                        $state.transitionTo($state.current, $stateParams, {
                            reload: true,
                            inherit: false,
                            notify: true
                        });
                    };

                    var sd = {
                        view: viewData,
                        roots: filesystem.roots(),
                        root: data.hierarchy ? data.hierarchy[0] : null,
                        hierarchy: data.hierarchy ? data.hierarchy.slice(1) : null,
                        data: data,
                        setViewType: function(t) {
                            viewData.type = t;
                            reload();
                        }
                    };

                    $scope.$parent.files = sd;
                    $.extend($scope, sd);

                    $scope.onItemAction = function(item, action, ctx) {
                        var itemAction = settings["file-view"].actions[action];
                        if (!itemAction) return;
                        if (typeof(itemAction) == "function") itemAction = itemAction(item);

                        console.log(item.name + " " + itemAction);
                        if (itemAction == "menu") {
                            $scope.showPopupmenu(ctx.e, item, actions.getType('filesystem', item));
                        } else if (itemAction == "quickactions") {
                            $scope.showQuickactions(ctx.e, item, actions.getType('quick', item));
                        } else if (itemAction == "details") {
                            $scope.showItemDetails(item);
                        } else {
                            $scope.onAction(itemAction, item);
                        }
                    };

                    $scope.onDragItem = function(item) {
                        return {
                            type: "filesystemitem",
                            payload: item
                        }
                    };

                    var dropType = function(to, i) {
                        var single = false;
                        if (!window.isArray(i)) single = i;
                        else if (i.length === 0) single = i[0];

                        var copy = (!single || to.root_id != single.root_id);
                        return copy ? "copy" : "move";
                    };

                    $scope.canDropItem = function(to, itm) {
                        var single = false;
                        if (!window.isArray(itm)) single = itm;
                        else if (itm.length === 0) single = itm[0];

                        if (single)
                            return dropType(to, single) == "copy" ? filesystem.canCopyTo(single, to) : filesystem.canMoveTo(single, to);

                        var can = true;
                        for (var i = 0; i < itm.length; i++) {
                            var item = itm[i];
                            if (!(that.dropType(to, item) == "copy" ? filesystem.canCopyTo(item, to) : filesystem.canMoveTo(item, to))) {
                                can = false;
                                break;
                            }
                        }
                        return can;
                    };

                    $scope.onDropItem = function(to, item) {
                        //console.log("ondrop " + item.name + " -> " + to.name);
                        var copy = (dropType(to, itm) == 'copy');
                        //console.log((copy ? "copy " : "move ") +itm.name+" to "+to.name);

                        if (copy) filesystem.copy(itm, to);
                        else filesystem.move(itm, to);
                    };
                }
            ]);

            gettext('file_open');
            h.registerAction({
                id: 'file/open',
                type: 'file',
                icon: "fa-folder-open-o",
                quick: true,
                titleKey: 'file_open',
                handler: ["$state",
                    function(item, $state) {
                        if (!item.is_file)
                            $state.go("files", {
                                id: item.id
                            });
                        else
                            alert("open file " + item.name);
                    }
                ]
            });

            gettext('file_download');
            h.registerAction({
                id: 'file/download',
                type: 'file',
                icon: "fa-download",
                quick: true,
                titleKey: 'file_download',
                handler: ["filesystem",
                    function(item, filesystem) {
                        //TODO angular way? download-directive?
                        $("#cloudberry-download-frame").attr("src", filesystem.getItemDownloadURL(item));
                    }
                ]
            });

            /* File list */

            var cols = false;
            var setupCols = function(settings) {
                var colConfig = settings['file-view']['list-view-columns'];
                var colSpecs = cloudberry.utils.mapByKey(cloudberry.filelist.columns, 'id');
                cols = [];

                $.each(cloudberry.utils.getKeys(colConfig), function(i, ck) {
                    var s = colSpecs[ck];
                    if (!s) return;
                    cols.push($.extend({}, s, colConfig[ck]));
                });
            };

            mod.controller('FilesListTableCtrl', ['$scope', '$timeout', 'settings', 'filesystem', 'formatters',
                function($scope, $timeout, settings, filesystem, formatters) {
                    if (!cols) setupCols(settings);

                    var fmt = {
                        byteSize: new formatters.ByteSize(new formatters.Number(2))
                    };
                    $scope.cols = cols;
                    $scope.selected = [];
                    $scope._click = false;

                    $scope.content = function(item, col) {
                        return col.content.apply({
                            filesystem: filesystem,
                            formatters: fmt
                        }, [item]);
                    };
                    var getCtx = function(e, col) {
                        return {
                            e: e,
                            col: col
                        }
                    };

                    $scope.onClick = function(e, item, col) {
                        $scope._click = $timeout(function() {
                            if (!$scope._click) return;
                            $scope._click = false;
                            $scope.onItemAction(item, "click", getCtx(e, col));
                        }, 200);
                    };

                    $scope.onRightClick = function(e, item, col) {
                        $scope.onItemAction(item, "right-click", getCtx(e, col));
                    };

                    $scope.onDblClick = function(e, item, col) {
                        if ($scope._click) $timeout.cancel($scope._click);
                        $scope._click = false;
                        $scope.onItemAction(item, "dbl-click", getCtx(e, col));
                    };

                    $scope.onMouseOver = function(e, item) {
                        $scope.onItemAction(item, "mouse-over", getCtx(e));
                        //$scope.showQuickactions(e, item, [{}]);
                    };

                    $scope.onMouseOut = function(e, item) {
                        $scope.onItemAction(item, "mouse-out", getCtx(e));
                        //$scope.showQuickactions(e, item, false);
                    };
                }
            ]);

            mod.controller('FilesListIconCtrl', ['$scope',
                function($scope) {
                    console.log("icon ctrl");
                }
            ]);

            // register file list columns
            gettext("filesList_colName");
            cloudberry.filelist.columns.push({
                id: "name",
                titleKey: "filesList_colName",
                sort: function(i1, i2, sort, data) {
                    return i1.name.toLowerCase().localeCompare(i2.name.toLowerCase()) * sort;
                },
                content: function(item, data) {
                    return item.name;
                }
            });
            gettext("filesList_colPath");
            cloudberry.filelist.columns.push({
                id: "path",
                titleKey: "filesList_colPath",
                sort: function(i1, i2, sort, data) {
                    var p1 = _m.filesystem.rootsById[i1.root_id].name + i1.path;
                    var p2 = _m.filesystem.rootsById[i2.root_id].name + i2.path;
                    return p1.toLowerCase().localeCompare(p2.toLowerCase()) * sort;
                },
                html: true,
                content: function(item, data) {
                    return '<span class="item-path-root">' + this.filesystem.root(item.root_id).name + '</span>: <span class="item-path-val">' + item.path + '</span>';
                }
            });
            gettext("filesList_colType");
            cloudberry.filelist.columns.push({
                id: "type",
                titleKey: "filesList_colType",
                sort: function(i1, i2, sort, data) {
                    var e1 = i1.is_file ? (i1.extension || '') : '';
                    var e2 = i2.is_file ? (i2.extension || '') : '';
                    return e1.toLowerCase().localeCompare(e2.toLowerCase()) * sort;
                },
                content: function(item, data) {
                    return item.is_file ? (item.extension || '') : '';
                }
            });
            gettext("filesList_colSize");
            cloudberry.filelist.columns.push({
                id: "size",
                titleKey: "filesList_colSize",
                opts: {
                    "min-width": 75
                },
                sort: function(i1, i2, sort, data) {
                    var s1 = (i1.is_file ? parseInt(i1.size, 10) : 0);
                    var s2 = (i2.is_file ? parseInt(i2.size, 10) : 0);
                    return (s1 - s2) * sort;
                },
                content: function(item, data) {
                    return item.is_file ? this.formatters.byteSize.format(item.size) : '';
                }
            });
            gettext("filesList_colLastModified");
            cloudberry.filelist.columns.push({
                id: "file-modified",
                dataId: "core-file-modified",
                titleKey: "filesList_colLastModified",
                opts: {
                    "width": 180
                },
                sort: function(i1, i2, sort, data) {
                    if (!i1.is_file && !i2.is_file) return 0;
                    if (!data || !data["core-file-modified"]) return 0;

                    var ts1 = data["core-file-modified"][i1.id] ? data["core-file-modified"][i1.id] * 1 : 0;
                    var ts2 = data["core-file-modified"][i2.id] ? data["core-file-modified"][i2.id] * 1 : 0;
                    return ((ts1 > ts2) ? 1 : -1) * sort;
                },
                content: function(item, data) {
                    if (!item.id || !item.is_file || !data || !data["core-file-modified"] || !data["core-file-modified"][item.id]) return "";
                    return this.formatters.timestamp.format(cloudberry.utils.parseInternalTime(data["core-file-modified"][item.id]));
                }
            });

            mod.directive('quickactionContainer', function($timeout) {
                var offset = {
                    top: 0,
                    left: 0
                };

                return function(scope, element, attributes) {
                    var _showTimeout = false;
                    var _hideTimeout = false;
                    var $popup = element.find('.quickaction-container');
                    var hidePopup = function() {
                        if (_hideTimeout) return;
                        _hideTimeout = $timeout(function() {
                            _hideTimeout = false;
                            scope.quickactions = null;
                            $popup.css("display", "none");
                        }, 200);
                    };
                    element.bind("click", function() {
                        if (_showTimeout) $timeout.cancel(_showTimeout);
                        hidePopup();
                    });
                    var containerOffset = element.offset();

                    scope.showQuickactions = function($event, parent, actions) {
                        if (!$event || !parent) {
                            if (scope.quickactions && parent === scope.quickactions.parent) return;
                            hidePopup();
                            return;
                        }
                        if (!actions) {
                            if ($event.toElement !== $popup[0])
                                hidePopup();
                            return;
                        }

                        if (_showTimeout) $timeout.cancel(_showTimeout);

                        if (_hideTimeout) {
                            // if set to be hidden, cancel it
                            $timeout.cancel(_hideTimeout);
                            _hideTimeout = false;

                            // if new parent is same as old, skip show
                            if (scope.quickactions && parent === scope.quickactions.parent) {
                                scope.quickactions.items = actions;
                                return;
                            }
                        }

                        var display;
                        var $parent = $($event.target).closest(".quickaction-parent");
                        if (!$parent || $parent.length === 0) {
                            hidePopup();
                        } else {
                            scope.quickactions = {
                                parent: parent,
                                items: actions
                            };
                            var parentOffset = $parent.offset();
                            _showTimeout = $timeout(function() {
                                _showTimeout = false;

                                $popup.css({
                                    top: (parentOffset.top - containerOffset.top) + 'px',
                                    left: (parentOffset.left - containerOffset.left + $parent.outerWidth() - $popup.outerWidth()) + 'px',
                                    display: "block"
                                });
                            }, 200);
                        }
                    }
                }
            });

            mod.directive('itemDetailsContainer', function($timeout) {
                return function(scope, element, attributes) {
                    var $details = element.find('.itemdetails-content');

                    var hideDetails = function() {
                        var df = $.Deferred();
                        scope.itemdetails = null;
                        $details.hide();
                        var $all = $(element).find(".item-details-container"); //.add($details);
                        $all.animate({
                            height: 0
                        }, {
                            duration: 200
                        }).promise().done(function() {
                            $all.hide();
                            df.resolve();
                        });
                        return df.promise();
                    };
                    var containerOffset = element.offset();

                    scope.showItemDetails = function(item) {
                        var same = (scope.itemdetails && scope.itemdetails.item.id == item.id);
                        hideDetails().done(function() {
                            if (same) {
                                // same as just closed, skip
                                return;
                            }

                            var $item = element.find('#item-' + item.id);
                            if (!$item) return;

                            var $itemDetailsTarget = $item.find(".item-details-container");
                            if ($itemDetailsTarget.length === 0) return;

                            scope.itemdetails = {
                                item: item
                            };
                            if (!scope.$$phase)
                                scope.$apply();

                            //var $t = $itemDetailsTarget.add($details);
                            $itemDetailsTarget.css({
                                height: '0px',
                                display: "block"
                            });

                            var parentOffset = $itemDetailsTarget.offset();
                            var h = 200;
                            $details.appendTo($itemDetailsTarget);
                            $details.css({
                                //top: (parentOffset.top - containerOffset.top) + 'px',
                                //left: (parentOffset.left - containerOffset.left) + 'px',
                                //width: $itemDetailsTarget.outerWidth() + 12 + 'px', //TODO 12? padding?
                                //height: '0px',
                                display: "block"
                            });
                            $itemDetailsTarget.animate({
                                height: h
                            }, 500);
                        });
                    }
                }
            });

            mod.controller('ItemDetailsCtrl', ['$scope', 'actions', 'itemDetails', '$controller', 'gettextCatalog',
                function($scope, actions, itemDetails, $controller, gettextCatalog) {
                    $scope.$watch('itemdetails', function(nv, ov) {
                        if (!$scope.itemdetails) return;

                        cloudberry.utils.setupDetailsCtrl($scope, $scope.itemdetails, $controller, gettextCatalog, itemDetails.getDetails(), {
                            item: $scope.itemdetails.item
                        });

                        $scope.itemdetails.actions = actions.getType('file');

                        if (!$scope.$$phase)
                            $scope.$apply();
                    });
                }
            ]);


            gettext("itemInfo_viewTitle");
            h.registerItemDetails('item_info', {
                controller: "ItemInfoCtrl",
                titleKey: "itemInfo_viewTitle",
                template: "item-info.html"
            });

            mod.controller('ItemInfoCtrl', ['$scope', 'filesystem',
                function($scope, filesystem) {
                    $scope.onItemInfoCtrl = function(ctx) {
                        console.log('item info ' + ctx.item.id);

                        $scope.item = ctx.item;
                        $scope.item_info = null;

                        filesystem.itemInfo($scope.item).done(function(i) {
                            $scope.item_info = i;
                            if (!$scope.$$phase)
                                $scope.$apply();
                        });
                    };
                }
            ]);

            gettext("itemComments_viewTitle");
            h.registerItemDetails('item_comments', {
                controller: "ItemCommentsCtrl",
                titleKey: "itemComments_viewTitle",
                template: "item-comments.html"
            });

            mod.controller('ItemCommentsCtrl', ['$scope',
                function($scope) {
                    $scope.ItemCommentsCtrl = function(ctx) {
                        console.log('item comments ' + ctx.item.id);
                        $scope.item = ctx.item;
                    };
                }
            ]);
        }
    });
}(window.cloudberry);
