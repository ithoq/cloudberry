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
            mod.directive('configTable', ['$parse', 'gettextCatalog',
                function($parse, gettextCatalog) {
                    return {
                        templateUrl: 'templates/config/config-table.html', //TODO url
                        replace: true,
                        transclude: true,
                        restrict: 'E',
                        scope: {
                            config: '=config',
                            values: '=values',
                            selected: '=selected'
                        },
                        //compile: function($element, attr) {
                        //var dataFn = $parse(attr['data']);
                        //var tableId = attr['tableid'];

                        compile: function() {
                            return {
                                pre: function(scope, element, attrs) {
                                    //scope.selected = [];
                                    //var config = scope.config;//scope[attr['config']];
                                    /*var getDataFn = function() {
                                        return dataFn(scope, {})();
                                    };*/
                                    var cols = [];
                                    $.each(scope.config.cols, function(i, col) {
                                        cols.push({
                                            field: col.key,
                                            displayName: gettextCatalog.getString(col.titleKey)
                                        });
                                    });
                                    if (scope.config.rowActions)
                                        cols.push({
                                            displayName: ' ',
                                            cellTemplate: '<div class="ngCellActions" ng-class="col.colIndex()"><a class="ngCellAction" ng-repeat="ac in config.rowActions" ng-click="onRowAction(ac, row.entity)"><i class="fa {{ac.icon}}"></a></div>'
                                        })

                                    scope.options = {
                                        enableRowSelection: true,
                                        selectWithCheckboxOnly: true,
                                        showSelectionCheckbox: true,
                                        data: 'values',
                                        columnDefs: cols,
                                        rowHeight: 33,
                                        headerRowHeight: 32
                                    };
                                    //scope._list = _table;
                                    //_table.options.selectedItems = _table.selectedItems;
                                    //if (tableId) scope.$parent[tableId] = _table;

                                    scope.isActionDisabled = function(ac) {
                                        if (!ac.selection) return false;
                                        if (ac.selection == 'any' && scope.selected.length === 0) return true;
                                        if (ac.selection == 'one' && scope.selected.length !== 1) return true;
                                        if (ac.selection == 'many' && scope.selected.length < 2) return true;
                                        return false;
                                    };
                                    scope.onAction = function(ac) {
                                        if (ac && ac.callback) ac.callback.apply(null, [scope.selected]);
                                    };
                                    scope.onRowAction = function(ac, row) {
                                        if (ac && ac.callback) ac.callback.apply(null, [row]);
                                    };
                                    /*var refresh = function() {
                                    getDataFn().done(function(r) {
                                        if (config.serverPaging)
                                            _table.values = r.data;
                                        else
                                            _table.values = r;

                                        if (!scope.$$phase)
                                            scope.$apply();
                                    })
                                };

                                if (!config.noInitRefresh) _table.refresh();*/
                                }
                            }
                        }
                    }
                }
            ]);
        }
    });

    var setupDetailsCtrl = function($scope, $timeout, $controller, gettextCatalog, details, ctx) {
        $scope.details = [];
        $scope.onTab = function(d) {
            var fn = 'on' + d.controllerName;
            if ($scope[fn]) $scope[fn]();
        };
        var params = $.extend({}, ctx, {
            '$scope': $scope
        });

        $.each(details, function(i, d) {
            var ctrl = $controller(d.controller, params);
            $scope.details.push({
                title: gettextCatalog.getString(d.titleKey),
                controllerName: d.controller,
                controller: ctrl,
                template: "templates/" + d.template //TODO url
            });
        });
        //if ($scope.details.length > 0)
        //  $scope._onCtrlReady = function() {
        $scope.onTab($scope.details[0]);
        //};
    };

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

            gettext("configUsers_list_name");
            mod.controller('ConfigUsersCtrl', ['$scope', '$state', 'userRepository', 'dialogs',
                function($scope, $state, userRepository, dialogs) {
                    $scope.users = [];
                    $scope.selectedUsers = [];
                    $scope.userListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configUsers_list_name'
                        }],
                        rowActions: [{
                            id: "open",
                            icon: 'fa-arrow-circle-right',
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
                    $scope.refreshUsers = function() {
                        userRepository.userQuery({
                            start: 0
                        }).done(function(r) {
                            $scope.users = r.data;
                        });
                    };
                    $scope.refreshUsers();
                }
            ]);

            h.registerDialog({
                id: "addEditUser",
                template: 'config/addedit_user.html',
                controller: function($scope, $modalInstance, settings, user) {
                    $scope.edit = !! user;
                    $scope.user = user || {};
                    $scope.showLanguages = (settings.language.options && settings.language.options.length > 1);
                    $scope.languages = settings.language.options;

                    $scope.onSave = function() {
                        $modalInstance.close($scope.user);
                    };

                    var generatePassword = function() {
                        var length = 8;
                        var password = '';
                        var c;

                        for (var i = 0; i < length; i++) {
                            while (true) {
                                c = (parseInt(Math.random() * 1000, 10) % 94) + 33;
                                if (isValidPasswordChar(c)) break;
                            }
                            password += String.fromCharCode(c);
                        }
                        return password;
                    }

                    var isValidPasswordChar = function(c) {
                        if (c >= 33 && c <= 47) return false;
                        if (c >= 58 && c <= 64) return false;
                        if (c >= 91 && c <= 96) return false;
                        if (c >= 123 && c <= 126) return false;
                        return true;
                    }

                    $scope.generatePassword = function() {
                        $scope.user.password = generatePassword();
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

            mod.controller('ConfigUserCtrl', ['$scope', '$timeout', '$controller', '$stateParams', 'gettextCatalog', 'userRepository', 'dialogs', 'configDetails', 'user',
                function($scope, $timeout, $controller, $stateParams, gettextCatalog, userRepository, dialogs, configDetails, user) {
                    $scope.user = user;

                    setupDetailsCtrl($scope, $timeout, $controller, gettextCatalog, configDetails.getDetails('user'), {
                        user: user
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
                    $scope.userFolders = [];
                    $scope.selectedUserFolders = [];

                    $scope.onConfigUserFoldersCtrl = function() {
                        console.log("user folders");
                        $scope.refreshUserFolders();
                        //$scope['usergroups-table'].refresh();
                    };

                    $scope.userFoldersListConfig = {
                        noInitRefresh: true,
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
                    $scope.refreshUserFolders = function() {
                        return userRepository.getUserFolders(user.id).done(function(f) {
                            $scope.userFolders = f;
                        })
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
                    $scope.userGroups = [];
                    $scope.selectedUserGroups = [];

                    $scope.onConfigUserGroupsCtrl = function() {
                        console.log("user groups");
                        $scope.refreshUserGroups();
                        //$scope['usergroups-table'].refresh();
                    };

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
                    $scope.refreshUserGroups = function() {
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

            gettext("configFolders_list_name");
            gettext("configFolders_list_path");
            gettext("configFolders_openFolder");
            mod.controller('ConfigFoldersCtrl', ['$scope', '$state', 'folderRepository', 'dialogs',
                function($scope, $state, folderRepository, dialogs) {
                    $scope.folderListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configFolders_list_name'
                        }, {
                            key: 'path',
                            titleKey: 'configFolders_list_path'
                        }],
                        rowActions: [{
                            id: "open",
                            icon: 'fa-arrow-circle-right',
                            titleKey: 'configFolders_openFolder',
                            callback: function(f) {
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

                    setupDetailsCtrl($scope, $controller, gettextCatalog, configDetails.getDetails('folder'), {
                        folder: folder
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

            gettext("configFolderUsers_list_name");
            gettext("configFolderUsers_list_email");
            mod.controller('ConfigFolderUsersCtrl', ['$scope', 'gettextCatalog', 'folderRepository', 'userRepository', 'dialogs', 'folder',
                function($scope, gettextCatalog, folderRepository, userRepository, dialogs, folder) {
                    $scope.folder = folder;

                    $scope.onConfigFolderUsersCtrl = function() {
                        console.log("folder users");
                        $scope._list.refresh();
                    };

                    $scope.folderUsersListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configFolderUsers_list_name'
                        }, {
                            key: 'email',
                            titleKey: 'configFolderUsers_list_email'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                                userRepository.getAllUsers().done(function(all) {
                                    var currentIds = cloudberry.helpers.extractValue($scope._list.values, "id");
                                    var possible = cloudberry.helpers.filter(all, function(u) {
                                        return currentIds.indexOf(u.id) < 0;
                                    });
                                    if (possible.length === 0) {
                                        //TODO message
                                        return;
                                    }
                                    dialogs.custom('selectItem', {
                                        title: gettextCatalog.getString('configFolderUsers_addFolderUser_title'),
                                        message: gettextCatalog.getString('configFolderUsers_addFolderUser_message'),
                                        options: possible,
                                        cols: [{
                                            key: 'id',
                                            titleKey: 'configTable_id'
                                        }, {
                                            key: 'name',
                                            titleKey: 'configUsers_list_name'
                                        }, {
                                            key: 'email',
                                            titleKey: 'configUsers_list_email'
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
