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
            mod.directive('configTable', ['$parse', 'gettextCatalog', '$timeout',
                function($parse, gettextCatalog, $timeout) {
                    return {
                        templateUrl: 'templates/config/config-table.html', //TODO url
                        replace: true,
                        transclude: true,
                        restrict: 'E',
                        scope: {
                            config: '=config',
                            values: '=values',
                            selected: '=selected',
                            paging: '=paging'
                        },

                        compile: function() {
                            return {
                                pre: function(scope, element, attrs) {
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
                                    scope._values = [];
                                    scope.total = 0;
                                    scope.options = {
                                        enableRowSelection: true,
                                        selectWithCheckboxOnly: true,
                                        showSelectionCheckbox: true,
                                        data: '_values',
                                        columnDefs: cols,
                                        rowHeight: 33,
                                        headerRowHeight: 32,
                                        showFooter: !! scope.paging,
                                        enablePaging: !! scope.paging,
                                        pagingOptions: scope.paging,
                                        //totalServerItems: scope.paging ? scope.total : undefined,
                                    };

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
                                    scope.$watch('values', function(v) {
                                        $timeout(function() {
                                            if (v && v.data && v.total) {
                                                scope._values = v.data.slice(0);
                                                scope.total = v.total;
                                            } else
                                                scope._values = v;
                                        }, 100);
                                    }, false);
                                }
                            }
                        }
                    }
                }
            ]);
        }
    });

    var setupDetailsCtrl = function($scope, $controller, gettextCatalog, details, ctx) {
        $scope.details = [];
        $scope.onSelectDetails = function(d) {
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
        $scope.onSelectDetails($scope.details[0]);
    };

    var createQuery = function(paging) {
        return {
            start: (paging.pageSize * (paging.currentPage - 1)),
            count: paging.pageSize
        };
    }

    /* Users */
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
                    $scope.users = null;
                    $scope.selectedUsers = [];
                    $scope.userPaging = {
                        pageSizes: [100, 250, 500, 1000],
                        pageSize: 100,
                        currentPage: 1
                    };
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
                    $scope.$watch('userPaging', function(newVal, oldVal) {
                        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage)
                            $scope.refreshUsers();
                    }, true);
                    $scope.refreshUsers = function() {
                        userRepository.userQuery(createQuery($scope.userPaging)).done(function(r) {
                            $scope.users = r;
                            if (!$scope.$$phase)
                                $scope.$apply();
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

            mod.controller('ConfigUserCtrl', ['$scope', '$controller', '$stateParams', 'gettextCatalog', 'userRepository', 'dialogs', 'configDetails', 'user',
                function($scope, $controller, $stateParams, gettextCatalog, userRepository, dialogs, configDetails, user) {
                    $scope.user = user;

                    setupDetailsCtrl($scope, $controller, gettextCatalog, configDetails.getDetails('user'), {
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
                    $scope.folders = [];
                    $scope.selectedFolders = [];

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
                                dialogs.custom('addEditFolder', null).done(function(f) {
                                    folderRepository.addFolder(f).done($scope.refresh);
                                });
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {
                                dialogs.confirmation("foo", "bar").done(function() {
                                    folderRepository.deleteFolders(sel).done($scope.refresh);
                                });
                            }
                        }]
                    };
                    $scope.refreshFolders = function() {
                        //TODO paging params
                        folderRepository.getAllFolders().done(function(f) {
                            $scope.folders = f;
                        });
                    }
                    $scope.refreshFolders();
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
                    $scope.folderUsers = [];
                    $scope.selectedFolderUsers = [];

                    $scope.onConfigFolderUsersCtrl = function() {
                        console.log("folder users");
                        $scope.refreshFolderUsers();
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
                                    var currentIds = cloudberry.utils.extractValue($scope.folderUsers, "id");
                                    var possible = cloudberry.utils.filter(all, function(u) {
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
                                        folderRepository.addFolderUsers(folder, u).done($scope.refreshFolderUsers);
                                    });
                                });
                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {}
                        }]
                    };
                    $scope.refreshFolderUsers = function() {
                        folderRepository.getFolderUsers(folder.id).done(function(u) {
                            $scope.folderUsers = u;
                        });
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
