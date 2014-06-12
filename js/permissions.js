! function(cloudberry) {
    'use strict';

    cloudberry.modules.push({
        id: 'cloudberry.plugin.permissions',

        setup: function(h, mod, gettext) {
            mod.factory('permissionRepository', ['$rootScope', 'c_service', 'cache',
                function($rootScope, c_service, cache) {
                    return {
                        getDefaultGenericPermissions: function(u) {
                            return c_service.get("permissions/user/" + (u ? u.id : '0') + "/generic/");
                        },
                        getUserGenericPermissions: function(u) {
                            return c_service.get("permissions/user/" + u.id + "/generic/");
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
            mod.controller('ConfigPermissionsCtrl', ['$scope', '$state', 'dialogs',
                function($scope, $state, userRepository, dialogs) {}
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

                    //gettext("configUserGroups_listName");
                    $scope.userPermissionsListConfig = {
                        cols: [{
                            key: 'name',
                            titleKey: 'name'
                        }, {
                            key: 'value',
                            titleKey: 'value'
                        }],
                        rowActions: [],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var t = this;
                            }
                        }]
                    };
                    $scope.refreshUserPermissions = function() {
                        cloudberry.utils.deferreds({
                            'default': permissionRepository.getDefaultGenericPermissions(),
                            'user': permissionRepository.getUserGenericPermissions(user)
                        }).done(function(r) {
                            var res = r.success;
                            var defaultPermissions = cloudberry.utils.mapByKey(res['default'].permissions, "name", "value");
                            var userPermissions = cloudberry.utils.mapByKey(res['user'].permissions, "name");
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

                            $scope.userPermissions = result;
                            if (!$scope.$$phase)
                                $scope.$apply();
                        });
                    }
                }
            ]);
        }
    });
}(window.cloudberry);
