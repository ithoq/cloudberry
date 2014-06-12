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

            mod.controller('ConfigUserPermissionsCtrl', ['$scope', 'permissionRepository', 'dialogs', 'user',
                function($scope, permissionRepository, dialogs, user) {
                    $scope.user = user;
                    $scope.userGroups = [];
                    $scope.selectedUserGroups = [];

                    $scope.onConfigUserPermissionsCtrl = function() {
                        console.log("user permissions");
                        $scope.refreshUserPermissions();
                        //$scope['usergroups-table'].refresh();
                    };

                    gettext("configUserGroups_listName");
                    $scope.userPermissionsListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
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
                        var df = $.Deferred();
                        var all = [permissionRepository.getDefaultGenericPermissions(), permissionRepository.getUserGenericPermissions(user)]
                        $.when.apply($, all).then(function() {
                            console.log('All done');
                        });
                        return df.promise();
                    }
                }
            ]);
        }
    });
}(window.cloudberry);
