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
                        template: '<div class="config-table"><div class="config-table-actions btn-group"><button class="config-table-action btn btn-default" ng-repeat="ac in listConfig.actions" ng-click="onAction(ac)"><i class="fa {{ac.icon}}"></button></div><div ng-grid="options"></div></div>',
                        replace: true,
                        transclude: true,
                        restrict: 'E',
                        controller: "ConfigTableCtrl",
                        /*scope: {
                            config: '=config'
                        },*/
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
                    $scope.options = {
                        data: 'list',
                        columnDefs: []
                    };
                    $scope.onAction = function(ac) {
                        if (ac && ac.callback) ac.callback();
                    };
                    $scope.refresh = function() {
                        $scope.getData().done(function(r) {
                            $scope.list = r.data;
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
                        }]
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
            mod.controller('ConfigFoldersCtrl', ['$scope', '$modal', 'service',
                function($scope, $modal, service) {
                    $scope.folderListConfig = {
                        cols: [{
                            key: 'id',
                            titleKey: 'configTable_id'
                        }, {
                            key: 'name',
                            titleKey: 'configFolders_listName'
                        }],
                        actions: [{
                            icon: 'fa-plus',
                            callback: function() {
                                var modalInstance = $modal.open({
                                    templateUrl: 'config/addedit_folder.html',
                                    controller: AddEditFolderController,
                                    resolve: {
                                        folder: function() {
                                            return null;
                                        }
                                    }
                                });
                                modalInstance.result.then(function(f) {
                                    alert(JSON.stringify(f));
                                }, function() {});
                            }
                        }]
                    };
                    $scope.getFolders = function() {
                        return service.get('configuration/folders');
                    }
                }
            ]);

            var AddEditFolderController = function($scope, $modalInstance, folder) {
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
            };
        }
    });
}(window.cloudberry);
