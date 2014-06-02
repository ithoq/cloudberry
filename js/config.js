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
                        columnDefs: [],
                        rowHeight: 33,
                        headerRowHeight: 32
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
            mod.controller('ConfigUsersCtrl', ['$scope', '$state', 'userRepository', 'dialogs',
                function($scope, $state, userRepository, dialogs) {
                    $scope.userListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configUsers_listName'
                        }],
                        rowActions: [{
                            id: "open",
                            icon: 'fa-plus',
                            titleKey: 'configUsers_openUser',
                            callback: function(u) {
                                $state.go("user", {
                                    userId: u.id
                                });
                            }
                        }],
                        serverPaging: true,
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                                dialogs.custom('addEditUser', null).done(function(u) {
                                    userRepository.addUser(u).done(t.refresh);
                                });
                            }
                        }]
                    };
                    $scope.getUsers = function() {
                        return userRepository.userQuery({
                            start: 0
                        });
                    }
                }
            ]);

            h.registerDialog({
                id: "addEditUser",
                template: 'config/addedit_user.html',
                controller: function($scope, $modalInstance, user) {
                    $scope.edit = !! user;
                    $scope.user = user || {};
                    $scope.showLanguages = true; //TODO

                    $scope.onSave = function() {
                        $modalInstance.close($scope.user);
                    };

                    $scope.generatePassword = function() {
                        $scope.user.password = "foo"; //TODO
                    };

                    $scope.ok = function() {
                        $modalInstance.close();
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                params: ['user']
            });

            h.registerView('user', {
                parent: "users",
                url: "/{userId:[0-9]{1,8}}",
                template: "config/user.html",
                controller: "ConfigUserCtrl",
                resolve: {
                    user: function($stateParams, userRepository) {
                        return userRepository.getUser($stateParams.userId);
                    }
                }
            });

            mod.controller('ConfigUserCtrl', ['$scope', '$controller', '$stateParams', 'gettextCatalog', 'userRepository', 'dialogs', 'configDetails', 'user',
                function($scope, $controller, $stateParams, gettextCatalog, userRepository, dialogs, configDetails, user) {
                    $scope.user = user;
                    $scope.details = [];

                    $.each(configDetails.getDetails('user'), function(i, d) {
                        var ctrl = $controller(d.controller, {
                            '$scope': $scope,
                            user: user
                        });
                        $scope.details.push({
                            title: gettextCatalog.getString(d.titleKey),
                            controller: ctrl,
                            template: "templates/" + d.template //TODO url
                        })
                    });
                }
            ]);
            gettext("configUserFolders_viewTitle");
            h.registerConfigDetails('user_folders', {
                parent: "user",
                controller: "ConfigUserFoldersCtrl",
                titleKey: "configUserFolders_viewTitle",
                template: "config/userfolders.html"
            });

            mod.controller('ConfigUserFoldersCtrl', ['$scope', 'userRepository', 'folderRepository', 'dialogs', 'user',
                function($scope, userRepository, folderRepository, dialogs, user) {
                    $scope.user = user;

                    $scope.userFoldersListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configUserFolders_listName'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {}
                        }]
                    };
                    $scope.getUserFolders = function() {
                        return userRepository.getUserFolders(user.id)
                    }
                }
            ]);

            gettext("configUserGroups_viewTitle");
            h.registerConfigDetails('user_groups', {
                parent: "user",
                controller: "ConfigUserGroupsCtrl",
                titleKey: "configUserGroups_viewTitle",
                template: "config/usergroups.html"
            });

            mod.controller('ConfigUserGroupsCtrl', ['$scope', 'userRepository', 'dialogs', 'user',
                function($scope, userRepository, dialogs, user) {
                    $scope.user = user;

                    $scope.userGroupsListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configUserGroups_listName'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {}
                        }]
                    };
                    $scope.getUserGroups = function() {
                        return userRepository.getUserGroups(user.id)
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
                                $state.go("folder", {
                                    folderId: f.id
                                });
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

            h.registerView('folder', {
                parent: "folders",
                url: "/{folderId:[0-9]{1,8}}",
                template: "config/folder.html",
                controller: "ConfigFolderCtrl",
                resolve: {
                    folder: function($stateParams, folderRepository) {
                        return folderRepository.getFolder($stateParams.folderId);
                    }
                }
            });

            mod.controller('ConfigFolderCtrl', ['$scope', '$controller', '$stateParams', 'gettextCatalog', 'folderRepository', 'dialogs', 'configDetails', 'folder',
                function($scope, $controller, $stateParams, gettextCatalog, folderRepository, dialogs, configDetails, folder) {
                    $scope.folder = folder;
                    $scope.details = [];

                    $.each(configDetails.getDetails('folder'), function(i, d) {
                        var ctrl = $controller(d.controller, {
                            '$scope': $scope,
                            folder: folder
                        });
                        $scope.details.push({
                            title: gettextCatalog.getString(d.titleKey),
                            controller: ctrl,
                            template: "templates/" + d.template //TODO url
                        })
                    });
                }
            ]);

            gettext("configFolderUsers_viewTitle");
            h.registerConfigDetails('folder_users', {
                parent: "folder",
                controller: "ConfigFolderUsersCtrl",
                titleKey: "configFolderUsers_viewTitle",
                template: "config/folderusers.html"
            });

            mod.controller('ConfigFolderUsersCtrl', ['$scope', 'folderRepository', 'userRepository', 'dialogs', 'folder',
                function($scope, folderRepository, userRepository, dialogs, folder) {
                    $scope.folder = folder;

                    $scope.folderUsersListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configFolderUsers_listName'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                                userRepository.getAllUsers().done(function(all) {
                                    var possible = all; //TODO resolve possible
                                    if (possible.length === 0) {
                                        //TODO message
                                        return;
                                    }
                                    dialogs.custom('selectItem', {
                                        title: 'todo',
                                        message: 'foo',
                                        options: possible,
                                        cols: [{
                                            key: 'id',
                                            titleKey: 'configTable_id'
                                        }, {
                                            key: 'name',
                                            titleKey: 'configUsers_listName'
                                        }]
                                    }).done(function(u) {
                                        folderRepository.addFolderUsers(folder, u).done(t.refresh);
                                    });
                                });
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {}
                        }]
                    };
                    $scope.getFolderUsers = function() {
                        return folderRepository.getFolderUsers(folder.id)
                    }
                }
            ]);

            h.registerDialog({
                id: "selectItem",
                template: 'config/select_item.html',
                controller: function($scope, $modalInstance, gettextCatalog, spec) {
                    $scope.spec = spec;
                    $scope.list = spec.options;
                    $scope.selectedItems = [];
                    var columns = [];
                    $.each(spec.cols, function(i, col) {
                        columns.push({
                            field: col.key,
                            displayName: gettextCatalog.getString(col.titleKey)
                        });
                    });
                    $scope.listOptions = {
                        enableRowSelection: true,
                        selectWithCheckboxOnly: true,
                        showSelectionCheckbox: true,
                        data: 'list',
                        selectedItems: $scope.selectedItems,
                        columnDefs: columns
                    };

                    $scope.ok = function() {
                        $modalInstance.close($scope.selectedItems);
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                params: ['spec']
            });
        }
    });
}(window.cloudberry);
