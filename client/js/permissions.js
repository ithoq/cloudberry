! function(cloudberry) {
    'use strict';

    cloudberry.modules.register({
        id: 'cloudberry.plugin.permissions',

        setup: function(h, mod, gettext) {
            mod.factory('permissions', ['$rootScope', 'session',
                function($rootScope, session) {
                    var _types = null;
                    var _filesystemPermissions = {};
                    var _permissions = {};

                    var updatePermissions = function(list, permissions) {
                        $.each(cloudberry.utils.getKeys(permissions), function(i, p) {
                            list[p] = permissions[p];
                        });
                    };
                    $rootScope.$on('session/start', function(e, s) {
                        if (!s.user) return;

                        _types = s.permissions.types;
                        updatePermissions(_permissions, s.permissions.user);
                    });

                    var hasPermission = function(list, name, required) {
                        if (!list || list[name] === undefined) return false;
                        var v = list[name];

                        var options = _types.values[name];
                        if (!required || !options) return v == "1";

                        var ui = options.indexOf(v);
                        var ri = options.indexOf(required);
                        return (ui >= ri);
                    };
                    return {
                        getTypes: function() {
                            return _types;
                        },
                        putFilesystemPermissions: function(id, permissions) {
                            if (!_filesystemPermissions[id]) _filesystemPermissions[id] = {};
                            updatePermissions(_filesystemPermissions[id], permissions);
                        },
                        hasFilesystemPermission: function(item, name, required) {
                            var user = session.get().user;
                            if (!user) return false;
                            if (user.admin) return true;
                            return hasPermission(_filesystemPermissions[((typeof(item) === "string") ? item : item.id)], name, required);
                        },
                        hasPermission: function(name, required) {
                            var user = session.get().user;
                            if (!user) return false;
                            if (user.admin) return true;
                            return hasPermission(_permissions, name, required);
                        }
                    }
                }
            ]);

            mod.factory('permissionRepository', ['$rootScope', 'c_service', 'cache',
                function($rootScope, service, cache) {
                    return {
                        getAllPermissions: function() {
                            return service.get("permissions/list");
                        },
                        getDefaultPermissions: function(u) {
                            return service.get("permissions/user/" + (u ? u.id : '0') + "/generic/");
                        },
                        getUserPermissions: function(u) {
                            return service.get("permissions/user/" + u.id + "/generic/");
                        }
                    }
                }
            ]);

            gettext("configPermissions_viewTitle");
            h.registerView('permissions', {
                titleKey: "configPermissions_viewTitle",
                requiresAdmin: true,
                icon: "fa-legal",
                parent: "config",
                url: "/permissions",
                template: "config/permissions.html",
                controller: "ConfigPermissionsCtrl"
            });

            //gettext("configPermissions_list_name");
            mod.controller('ConfigPermissionsCtrl', ['$scope', '$state', 'permissionRepository', 'dialogs',
                function($scope, $state, permissionRepository, dialogs) {
                    $scope.permissions = [];
                    $scope.selectedPermissions = [];

                    $scope.permissionListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }],
                        rowActions: [{
                            id: "open",
                            icon: 'fa-arrow-circle-right',
                            titleKey: 'configFolders_openFolder',
                            callback: function(f) {

                            }
                        }],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {

                            }
                        }, {
                            icon: 'fa-minus',
                            selection: 'any',
                            callback: function(sel) {

                            }
                        }]
                    };
                    $scope.refreshPermissions = function() {
                        //TODO paging params
                        permissionRepository.getAllPermissions().done(function(p) {
                            $scope.permissions = p;
                        });
                    }
                    $scope.refreshPermissions();
                }
            ]);

            gettext("configUserPermissions_viewTitle");
            h.registerConfigDetails('user_permissions', {
                parent: "user",
                controller: "ConfigUserPermissionsCtrl",
                titleKey: "configUserPermissions_viewTitle",
                template: "config/userpermissions.html"
            });

            mod.controller('ConfigUserPermissionsCtrl', ['$scope', 'permissionRepository', 'permissions', 'dialogs', 'user',
                function($scope, permissionRepository, permissions, dialogs, user) {
                    $scope.user = user;
                    $scope.userPermissions = [];

                    $scope.onConfigUserPermissionsCtrl = function() {
                        console.log("user permissions");
                        $scope.refreshUserPermissions();
                    };

                    gettext("pluginPermissions_permissionName");
                    gettext("pluginPermissions_permissionValue");
                    gettext("pluginPermissions_permissionSystemDefaultValue");
                    $scope.userPermissionsListConfig = {
                        cols: [{
                            key: 'name',
                            titleKey: 'pluginPermissions_permissionName'
                        }, {
                            key: 'value',
                            titleKey: 'pluginPermissions_permissionValue'
                        }, {
                            key: 'default_value',
                            titleKey: 'pluginPermissions_permissionSystemDefaultValue'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-user',
                            callback: function() {
                                permissionRepository.getDefaultPermissions(user).done(function(r) {
                                    dialogs.custom('pluginPermissions_editGenericPermissions', user, r.permissions).done(function(p) {
                                        //userRepository.addUser(u).done($scope.refreshUsers);
                                    });
                                });
                            }
                        }, {
                            icon: 'fa-globe',
                            callback: function() {
                                var t = this;
                            }
                        }]
                    };
                    var processPermissions = function(d, u) {
                        var defaultPermissions = cloudberry.utils.mapByKey(d, "name", "value");
                        var userPermissions = cloudberry.utils.mapByKey(u, "name");
                        var result = [];

                        $.each(permissions.getTypes().keys.all, function(i, t) {
                            var p = userPermissions[t];
                            if (!p) p = {
                                name: t,
                                value: undefined,
                                subject: '',
                                user_id: user.id
                            };
                            p.default_value = defaultPermissions[t];
                            result.push(p);
                        });
                        return result;
                    };
                    $scope.refreshUserPermissions = function() {
                        return cloudberry.utils.deferreds({
                            systemDefault: permissionRepository.getDefaultPermissions(),
                            user: permissionRepository.getUserPermissions(user)
                        }).done(function(r) {
                            var res = r.success;
                            $scope.userPermissions = processPermissions(res.systemDefault.permissions, res.user.permissions);
                            if (!$scope.$$phase)
                                $scope.$apply();
                        });
                    }
                }
            ]);

            h.registerDialog({
                id: "pluginPermissions_editGenericPermissions",
                template: 'config/permissions_editgeneric.html',
                controller: function($scope, $modalInstance, settings, user, permissions) {
                    $scope.edit = !!user;
                    $scope.user = user;
                    $scope.permissions = permissions;

                    $scope.onSave = function() {
                        $modalInstance.close($scope.user);
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                params: ['user', 'permissions']
            });
        }
    });
}(window.cloudberry);
