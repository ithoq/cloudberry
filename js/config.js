! function(cloudberry) {
    'use strict';

    cloudberry.modules.push({
        id: 'cloudberry.main.config',

        setup: function(h, mod, gettext) {
            gettext("config_viewTitle");
            h.registerView('config', {
                titleKey: "config_viewTitle",
                icon: "fa-cog",
                parent: "main",
                url: "^/config",
                template: "config.html",
                controller: "ConfigCtrl",
                redirect: ['views',
                    function(to, views) {
                        if ((to.toState && to.toState.name == 'config') || (to.location && to.location.$$path == '/config')) {
                            var views = views.get('config');
                            if (!views) return;
                            return views[0].id;
                        }
                    }
                ],
                subviews: {
                    'header-nav': {
                        template: 'config-header-nav.html'
                    }
                }
            });

            mod.controller('ConfigCtrl', ['$scope', '$state', '$stateParams', 'views', 'actions',
                function($scope, $state, $stateParams, views, actions) {
                    $scope.$parent.config = {
                        views: views.get('config')
                    };
                }
            ]);

            gettext("configTable_id");
            mod.directive('configTable', ['$parse',
                function($parse) {
                    return {
                        templateUrl: 'templates/config/config-table.html', //TODO url
                        replace: true,
                        transclude: true,
                        restrict: 'E',
                        controller: "ConfigTableCtrl",
                        compile: function($element, attr) {
                            var dataFn = $parse(attr['data']);
                            //var configFn = $parse(attr['config']);

                            return {
                                pre: function(scope, element, attr) {
                                    scope.listConfig = scope[attr['config']];
                                    scope.getData = function() {
                                        return dataFn(scope, {})();
                                    }
                                    scope._onReady();
                                }
                            }
                        }
                    };
                }
            ]);

            mod.controller('ConfigTableCtrl', ['$scope', 'service', 'gettextCatalog',
                function($scope, service, gettextCatalog) {
                    $scope.list = [];
                    $scope.selectedItems = [];
                    $scope.options = {
                        enableRowSelection: true,
                        selectWithCheckboxOnly: true,
                        showSelectionCheckbox: true,
                        data: 'list',
                        selectedItems: $scope.selectedItems,
                        columnDefs: []
                    };
                    $scope.isActionDisabled = function(ac) {
                        if (!ac.selection) return false;
                        if (ac.selection == 'any' && $scope.selectedItems.length === 0) return true;
                        if (ac.selection == 'one' && $scope.selectedItems.length !== 1) return true;
                        if (ac.selection == 'many' && $scope.selectedItems.length < 2) return true;
                        return false;
                    };
                    $scope.onAction = function(ac) {
                        if (ac && ac.callback) ac.callback.apply({
                            refresh: $scope.refresh
                        }, [$scope.selectedItems]);
                    };
                    $scope.onRowAction = function(ac, row) {
                        if (ac && ac.callback) ac.callback.apply({
                            refresh: $scope.refresh
                        }, [row]);
                    };
                    $scope.refresh = function() {
                        $scope.getData().done(function(r) {
                            if ($scope.listConfig.serverPaging)
                                $scope.list = r.data;
                            else
                                $scope.list = r;

                            if (!$scope.$$phase)
                                $scope.$apply();
                        })
                    };
                    $scope._onReady = function() {
                        var cols = [];
                        $.each($scope.listConfig.cols, function(i, col) {
                            cols.push({
                                field: col.key,
                                displayName: gettextCatalog.getString(col.titleKey)
                            });
                        });
                        if ($scope.listConfig.rowActions)
                            cols.push({
                                displayName: '',
                                cellTemplate: '<div class="ngCellActions" ng-class="col.colIndex()"><a class="ngCellAction" ng-repeat="ac in listConfig.rowActions" ng-click="onRowAction(ac, row.entity)"><i class="fa {{ac.icon}}"></a></div>'
                            })
                        $scope.options.columnDefs = cols;
                        $scope.refresh();
                    }
                }
            ]);
        }
    });

    / * Users * /
    cloudberry.modules.push({
        id: 'cloudberry.config.users',

        setup: function(h, mod, gettext) {
            gettext("configUsers_viewTitle");
            h.registerView('users', {
                titleKey: "configUsers_viewTitle",
                icon: "fa-user",
                parent: "config",
                url: "/users",
                template: "config/users.html",
                controller: "ConfigUsersCtrl"
            });

            gettext("configUsers_listName");
            mod.controller('ConfigUsersCtrl', ['$scope', 'service',
                function($scope, service) {
                    $scope.userListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configUsers_listName'
                        }],
                        serverPaging: true
                    };
                    $scope.getUsers = function() {
                        return service.post('configuration/users/query', {
                            start: 0
                        });
                    }
                }
            ]);
        }
    });

    / * Folders * /
    cloudberry.modules.push({
        id: 'cloudberry.config.folders',

        setup: function(h, mod, gettext) {
            gettext("configFolders_viewTitle");
            h.registerView('folders', {
                titleKey: "configFolders_viewTitle",
                icon: "fa-folder",
                parent: "config",
                url: "/folders",
                template: "config/folders.html",
                controller: "ConfigFoldersCtrl"
            });

            gettext("configFolders_listName");
            gettext("configFolders_listPath");
            mod.controller('ConfigFoldersCtrl', ['$scope', '$state', 'folderRepository', 'dialogs',
                function($scope, $state, folderRepository, dialogs) {
                    $scope.folderListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configFolders_listName'
                        }, {
                            key: 'path',
                            titleKey: 'configFolders_listPath'
                        }],
                        rowActions: [{
                            id: "open",
                            icon: 'fa-plus',
                            titleKey: 'configFolders_openFolder',
                            callback: function(f) {
                                console.log(f);
                                $state.go("folder", {folderId:f.id});
                            }
                        }],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                                dialogs.custom('addEditFolder', null).done(function(f) {
                                    folderRepository.addFolder(f).done(t.refresh);
                                });
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {
                                dialogs.confirmation("foo", "bar").done(function() {
                                    folderRepository.deleteFolders(sel).done(this.refresh);
                                });
                            }
                        }]
                    };
                    $scope.getFolders = function() {
                        //TODO paging params
                        return folderRepository.getAllFolders();
                    }
                }
            ]);

            h.registerDialog({
                id: "addEditFolder",
                template: 'config/addedit_folder.html',
                controller: function($scope, $modalInstance, folder) {
                    $scope.folder = folder || {};

                    $scope.onSave = function() {
                        $modalInstance.close($scope.folder);
                    };

                    $scope.ok = function() {
                        $modalInstance.close();
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                params: ['folder']
            });

            gettext("configFolders_viewTitle");
            h.registerView('folder', {
                parent: "folders",
                url: "/:folderId",
                template: "config/folder.html",
                controller: "ConfigFolderCtrl"
            });

            mod.controller('ConfigFolderCtrl', ['$scope', '$stateParams', 'folderRepository', 'dialogs',
                function($scope, $stateParams, folderRepository, dialogs) {

                }
            ]);
        }
    });
}(window.cloudberry);
