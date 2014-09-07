! function(cloudberry) {
    'use strict';

    /* Platform */
    cloudberry.platform.push({
        setup: function(app, o, gettext) {
            // resources
            var _get = function(u) {
                if (!o.settings["resource-map"]) return u;

                var urlParts = cloudberry.utils.breakUrl(u);
                if (!urlParts) return u;

                var mapped = o.settings["resource-map"][urlParts.path];
                if (mapped === undefined) return u;
                if (mapped === false) return false;

                return mapped + urlParts.paramsString;
            };
            var resources = {
                url: function(u) {
                    return _get(u);
                },
                templateUrl: function(t) {
                    var tu = t;
                    if (t.indexOf(':') >= 0) {
                        var parts = t.split(':');
                        var module = parts[0];
                        tu = parts[1];
                        tu = 'workbench/' + module.replace('.', '/') + '/public/' + o.settings["templates-path"] + tu;
                    } else {
                        tu = o.settings["templates-path"] + tu;
                    }
                    //return 'workbench/cloudberry/core/public/' + _get(o.settings["templates-path"]) + t;
                    return _get(tu);
                }
            };

            app.config(function($provide) {
                $provide.factory('settings', function() {
                    return o.settings;
                });

                $provide.factory('resources', function() {
                    return resources;
                });

                $provide.factory('views', function() {
                    return {
                        all: o.views,
                        get: function(parent, filter) {
                            var result = [];
                            $.each(o.views, function(i, v) {
                                if (v.parent == parent) {
                                    if (!filter || filter(v)) result.push(v);
                                }
                            });
                            return result;
                        }
                    };
                });

                $provide.factory('actions', ['permissions', 'session',
                    function(permissions, session) {
                        return {
                            getType: function(type, applicable) {
                                var list = o.actions.byType[type];
                                if (!applicable) return list;

                                var filtered = [];
                                var u = session.get().user;

                                $.each(list, function(i, a) {
                                    var applicable = false;
                                    if ((u && u.admin) || !a.permissions) applicable = true;
                                    else {
                                        $.each(cloudberry.utils.getKeys(a.permissions), function(j, pk) {
                                            if (permissions.hasPermission(pk, a.permissions[pk])) applicable = true;
                                        });
                                    }
                                    if (applicable) filtered.push(a);
                                });
                                return filtered;
                            }
                        };
                    }
                ]);

                $provide.factory('configDetails', function() {
                    return {
                        getDetails: function(parent) {
                            if (!o.configDetails[parent]) return [];
                            return o.configDetails[parent];
                        }
                    };
                });

                $provide.factory('itemDetails', function() {
                    return {
                        getDetails: function() {
                            return o.itemDetails;
                        }
                    };
                });
            });

            app.run(['$templateCache', 'formatters', 'gettextCatalog',
                function($templateCache, formatters, gettextCatalog) {
                    //popover
                    $templateCache.put("template/popover/popover-template.html",
                        "<div class=\"popover {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
                        "  <div class=\"arrow\"></div>\n" +
                        "  <div class=\"popover-inner\">\n" +
                        "      <h3 class=\"popover-title\" ng-bind=\"title\" ng-show=\"title\"></h3>\n" +
                        "      <div class=\"popover-content\"></div>\n" +
                        "  </div>\n" +
                        "</div>\n" +
                        "");

                    // ng-grid footer
                    gettext('grid_totalCount');
                    gettext('grid_pageSize');
                    gettext('grid_firstPage');
                    gettext('grid_prevPage');
                    gettext('grid_nextPage');
                    gettext('grid_lastPage');
                    $templateCache.put('footerTemplate.html',
                        "<div ng-show=\"showFooter\" class=\"ngFooterPanel\" ng-class=\"{'ui-widget-content': jqueryUITheme, 'ui-corner-bottom': jqueryUITheme}\" ng-style=\"footerStyle()\">\r" +
                        "\n" +
                        "    <div class=\"ngTotalSelectContainer\" >\r" +
                        "\n" +
                        "        <div class=\"ngFooterTotalItems\" ng-class=\"{'ngNoMultiSelect': !multiSelect}\" >\r" +
                        "\n" +
                        "            <span class=\"ngLabel\"><span translate>grid_totalCount</span> {{maxRows()}}</span><span ng-show=\"filterText.length > 0\" class=\"ngLabel\" translate>(grid_filteredCount {{totalFilteredItemsLength()}})</span>\r" +
                        "\n" +
                        "        </div>\r" +
                        "\n" +
                        "    </div>\r" +
                        "\n" +
                        "    <div class=\"ngPagerContainer\" ng-show=\"enablePaging\" ng-class=\"{'ngNoMultiSelect': !multiSelect}\">\r" +
                        "\n" +
                        "        <div class=\"ngRowCountPicker\">\r" +
                        "\n" +
                        "            <span class=\"ngLabel\" translate>grid_pageSize</span>\r" +
                        "\n" +
                        "            <select class=\"form-control\" ng-model=\"pagingOptions.pageSize\" >\r" +
                        "\n" +
                        "                <option ng-repeat=\"size in pagingOptions.pageSizes\">{{size}}</option>\r" +
                        "\n" +
                        "            </select>\r" +
                        "\n" +
                        "        </div>\r" +
                        "\n" +
                        "        <ul class=\"pagination ngPagerControl\">\r" +
                        "\n" +
                        "            <li ng-class=\"{'disabled':cantPageBackward()}\" class=\"first\"><a ng-click=\"pageToFirst()\" title=\"grid_firstPage | translate\"><i class=\"fa fa-fast-backward\"></i></a></li>\r" +
                        "\n" +
                        "            <li ng-class=\"{'disabled':cantPageBackward()}\" class=\"prev\"><a ng-click=\"pageBackward()\" title=\"grid_prevPage | translate\"><i class=\"fa fa-backward\"></i></a></li>\r" +
                        "\n" +
                        "            <li class=\"current\"><input class=\"form-control ngPagerCurrent\" min=\"1\" max=\"{{currentMaxPages}}\" type=\"number\" ng-model=\"pagingOptions.currentPage\"/></li>\r" +
                        "\n" +
                        "            <span class=\"ngGridMaxPagesNumber\" ng-show=\"maxPages() > 0\">/ {{maxPages()}}</span>\r" +
                        "\n" +
                        "            <li ng-class=\"{'disabled':cantPageForward()}\" class=\"next\"><a ng-click=\"pageForward()\" title=\"grid_nextPage | translate\"><i class=\"fa fa-fast-forward\"></i></a></li>\r" +
                        "\n" +
                        "            <li ng-class=\"{'disabled':cantPageForward()}\" class=\"last\"><a ng-click=\"pageToLast()\" title=\"grid_lastPage | translate\"><i class=\"fa fa-forward\"></i></a></li>\r" +
                        "\n" +
                        "        </ul>\r" +
                        "\n" +
                        "    </div>\r" +
                        "\n" +
                        "</div>\r" +
                        "\n"
                    );

                    //predefined formatters
                    formatters.setPredefined('date', new formatters.Timestamp(gettextCatalog.getString('timestamp_shortDate')));
                    formatters.setPredefined('time', new formatters.Timestamp(gettextCatalog.getString('timestamp_time')));
                    formatters.setPredefined('datetime', new formatters.Timestamp(gettextCatalog.getString('timestamp_shortDateTime')));
                }
            ]);

            // views
            app.
            config(['$stateProvider', '$urlRouterProvider',
                function($stateProvider, $urlRouterProvider) {
                    // For any unmatched url, redirect to /files
                    //$urlRouterProvider.otherwise("/files");
                    //$urlRouterProvider.otherwise(function($injector, $location) {
                    //    console.log("NOT FOUND: "+$location.$$path);
                    //    return "login";
                    //});

                    var templateUrlFn = function(tpl) {
                        return function(stateParams) {
                            var tplName = angular.isFunction(tpl) ? tpl(stateParams) : tpl;
                            return resources.templateUrl(tplName);
                        };
                    };

                    var rd = [];
                    var setupView = function(vk, v) {
                        var vp = {};
                        var subviews = false;
                        if (v.abstract) vp.abstract = true;
                        if (v.url) vp.url = v.url;
                        if (v.parent) vp.parent = v.parent;
                        if (v.resolve) vp.resolve = v.resolve;

                        if (v.subviews) {
                            subviews = {};
                            $.each(cloudberry.utils.getKeys(v.subviews), function(i, svk) {
                                var sv = v.subviews[svk];
                                var svp = {
                                    templateUrl: templateUrlFn(sv.template)
                                };
                                if (sv.controller) {
                                    if (angular.isFunction(sv.controller)) svp.controllerProvider = sv.controller;
                                    else svp.controller = sv.controller;
                                }
                                if (svp.resolve) svp.resolve = sv.resolve;

                                subviews[svk] = svp;
                            });
                            subviews[''] = {
                                controller: v.controller,
                                templateUrl: templateUrlFn(v.template)
                            };
                            vp.views = subviews;
                        } else {
                            if (v.controller) {
                                if (angular.isFunction(v.controller)) vp.controllerProvider = v.controller;
                                else vp.controller = v.controller;
                            }
                            vp.templateUrl = templateUrlFn(v.template);
                        }

                        console.log("VIEW:" + vk);
                        console.log(vp);
                        $stateProvider
                            .state(vk, vp);

                        if (v.redirect) {
                            var fn = false;
                            var deps = false;

                            if (typeof(v.redirect) == 'function') fn = v.redirect;
                            else if (window.isArray(v.redirect) && v.redirect.length > 0) {
                                fn = v.redirect[v.redirect.length - 1];
                                deps = v.redirect.slice(0, v.redirect.length - 1);
                            }

                            if (fn) rd.push({
                                id: vk,
                                fn: fn,
                                deps: deps
                            });
                        }
                    };
                    $.each(cloudberry.utils.getKeys(o.views), function(i, vk) {
                        var v = o.views[vk];
                        setupView(vk, v);
                    });
                    cloudberry._setupView = setupView;

                    if (rd.length > 0) $urlRouterProvider.rule(function($injector, $location) {
                        var res = undefined;

                        $.each(rd, function(i, rde) {
                            //TODO matches location?
                            var deps = [];
                            var args = [{
                                location: $location
                            }];
                            if (rde.deps)
                                for (var i = 0; i <= rde.deps.length - 1; i++) args.push($injector.get(rde.deps[i]));
                            res = rde.fn.apply(null, args);
                            if (res) return false;
                        });
                        return res;
                    });
                }
            ]);

            gettext('dialogOK');
            gettext('dialogCancel');
            app.factory('dialogs', ['$rootScope', 'resources', '$modal',
                function($rootScope, resources, $modal) {
                    return {
                        confirmation: function(title, message) {
                            var df = $.Deferred();
                            var modalInstance = $modal.open({
                                templateUrl: 'core/confirmation_dialog.html',
                                controller: function($modalInstance, $scope, spec) {
                                    $scope.spec = spec;

                                    $scope.ok = function() {
                                        $modalInstance.close();
                                    };

                                    $scope.cancel = function() {
                                        $modalInstance.dismiss('cancel');
                                    };
                                },
                                resolve: {
                                    spec: function() {
                                        return {
                                            title: title,
                                            message: message
                                        };
                                    }
                                }
                            });
                            modalInstance.result.then(df.resolve);
                            return df.promise();
                        },
                        custom: function(id) {
                            var df = $.Deferred();
                            var d = o.dialogs[id];
                            if (!d) return;

                            var resolve = {};
                            if (d.params) {
                                var args = arguments;
                                $.each(d.params, function(i, p) {
                                    if (args.length <= i + 1) return false;
                                    var a = args[i + 1];
                                    if (typeof(a) == 'function') resolve[p] = a;
                                    else
                                        resolve[p] = (function(v) {
                                            return function() {
                                                return v;
                                            }
                                        })(a);
                                })
                            }

                            var modalInstance = $modal.open({
                                templateUrl: resources.templateUrl(d.template),
                                controller: d.controller,
                                resolve: resolve
                            });
                            modalInstance.result.then(function(r) {
                                df.resolve(r);
                            }, df.reject);
                            return df.promise();
                        }
                    }
                }
            ]);

            app.directive('ngRightClick', function($parse) {
                return function(scope, element, attrs) {
                    var fn = $parse(attrs.ngRightClick);
                    element.bind('contextmenu', function(event) {
                        scope.$apply(function() {
                            event.preventDefault();
                            fn(scope, {
                                $event: event
                            });
                        });
                    });
                };
            });

            app.directive('menuList', function() {
                return {
                    template: '<ul class="dropdown-menu" role="menu"><menu-item ng-repeat="item in items"></menu-item></ul>',
                    replace: true,
                    transclude: true,
                    restrict: 'E',
                    scope: {
                        items: '=ngItems',
                        ctx: '=ngCtx'
                    }
                };
            });

            app.directive('menuItem', function($rootScope, $compile) {
                return {
                    restrict: 'E',
                    replace: true,
                    transclude: true,
                    template: '<li>' + '<a href="#" ng-click="onItem(item)">' + '<i class="fa {{item.icon}}"></i>&nbsp;' + '{{item.titleKey | translate}}' + '</a>' + '</li>',
                    link: function(scope, elm, attrs) {
                        scope.onItem = function(item) {
                            $rootScope.onAction(item, scope.ctx);
                        };
                        /*if (scope.item.children && scope.item.children.length > 0) {
                        var subItems = $compile('<menu-list ng-model="item.children"></menu-list>')(scope)
                        elm.append(subItems);
                    }*/
                    }
                };
            });

            var _dragObj = false;

            app.directive('draggable', ['$parse',
                function($parse) {
                    return {
                        restrict: 'A',
                        compile: function($element, attr) {
                            var onDragStart = $parse(attr['draggable']);

                            return function(scope, element, attr) {
                                var domElement = element[0];

                                domElement.draggable = true;
                                domElement.addEventListener('dragstart', function(e) {
                                    var dragObj = false;
                                    _dragObj = false;

                                    e.dataTransfer.effectAllowed = "none";
                                    if (!onDragStart) return false;

                                    scope.$apply(function() {
                                        dragObj = onDragStart(scope, {
                                            $event: e
                                        });
                                    });
                                    if (!dragObj) return false;

                                    var dragImageType = dragObj.type;
                                    if (dragObj.type == 'filesystemitem') {
                                        var pl = dragObj.payload;
                                        if (!window.isArray(pl) || pl.length == 1) {
                                            var item = window.isArray(pl) ? pl[0] : pl;

                                            if (!item.is_file) dragImageType = "filesystemitem-folder";
                                            else dragImageType = "filesystemitem-file";
                                        } else {
                                            dragImageType = "filesystemitem-many";
                                        }
                                        //TODO api.enableDragToDesktop(pl, e);
                                    }
                                    var $e = $(this);
                                    $e.addClass("dragged");
                                    e.dataTransfer.effectAllowed = "copyMove";

                                    console.log("DRAG START " + dragObj.type);
                                    _dragObj = {
                                        obj: dragObj,
                                        $e: $e
                                    };

                                    if (o.settings.dnd.dragimages[dragImageType]) {
                                        var img = document.createElement("img");
                                        img.src = o.settings.dnd.dragimages[dragImageType];
                                        e.dataTransfer.setDragImage(img, 0, 0);
                                    }
                                    return;
                                });
                            };
                        }
                    };
                }
            ]);

            app.directive('droppable', ['$parse',
                function($parse) {
                    return {
                        restrict: 'A',
                        compile: function($element, attr) {
                            var onDrop = $parse(attr['droppable']);
                            var canDrop = $parse(attr['candrop']);
                            var dropAcceptType = attr['dropaccepttype'];

                            return function(scope, element, attr) {
                                var domElement = element[0];

                                domElement.droppable = true;
                                domElement.addEventListener('drop', function(e) {
                                    if (e.stopPropagation) e.stopPropagation();
                                    if (!_dragObj || _dragObj.$e[0] === this) return;
                                    if (dropAcceptType && dropAcceptType != _dragObj.obj.type) return;

                                    scope.$apply(function() {
                                        onDrop(scope, {
                                            dragObj: _dragObj.obj.payload,
                                            dragType: _dragObj.obj.type,
                                            $event: e
                                        });
                                    });
                                    $(this).removeClass("dragover");
                                    _dragObj = false;
                                });
                                domElement.addEventListener('dragenter', function(e) {
                                    if (!_dragObj || _dragObj.$e[0] === this) return false;
                                    if (dropAcceptType && dropAcceptType != _dragObj.obj.type) return;

                                    var dropSpec = false;
                                    scope.$apply(function() {
                                        dropSpec = canDrop(scope, {
                                            dragObj: _dragObj.obj.payload,
                                            dragType: _dragObj.type,
                                            $event: e
                                        });
                                    });
                                    if (!dropSpec) return false;
                                    $(this).addClass("dragover");
                                });
                                domElement.addEventListener('dragover', function(e) {
                                    if (!_dragObj || _dragObj.$e[0] === this) return false;
                                    if (dropAcceptType && dropAcceptType != _dragObj.obj.type) return;
                                    if (e.preventDefault) e.preventDefault();

                                    var fx = "none";
                                    var dropSpec = false;

                                    scope.$apply(function() {
                                        dropSpec = canDrop(scope, {
                                            dragObj: _dragObj.obj.payload,
                                            dragType: _dragObj.type,
                                            $event: e
                                        });
                                    });
                                    if (!dropSpec) return false;
                                    if (dropSpec === true) fx = (dropSpec === true) ? "copy" : dropSpec;

                                    e.dataTransfer.dropEffect = fx;
                                    return false;
                                });
                                domElement.addEventListener('dragleave', function(e) {
                                    $(this).removeClass("dragover");
                                });
                            };
                        }
                    };
                }
            ]);
        }
    });
}(window.cloudberry);
