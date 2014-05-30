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

            mod.directive('pagingTable', function() {
                return {
                    template: '<div class="paging-table">head<div ng-grid="gridOptions"></div></div>',
                    replace: true,
                    //transclude: true,
                    restrict: 'E',
                    controller: "PagingTableCtrl",
                    scope: {
                        serviceCb: '=serviceCb'
                    }
                };
            });

            mod.controller('PagingTableCtrl', ['$scope', 'service',
                function($scope, service) {
                    console.log("paging");
                    $scope.myData = [{
                        name: "Moroni",
                        age: 50
                    }, {
                        name: "Tiancum",
                        age: 43
                    }, {
                        name: "Jacob",
                        age: 27
                    }, {
                        name: "Nephi",
                        age: 29
                    }, {
                        name: "Enos",
                        age: 34
                    }];
                    $scope.gridOptions = {
                        data: 'myData'
                    };
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
                controller: "ConfigUsersCtrl",
                resolve: {},
            });

            mod.controller('ConfigUsersCtrl', ['$scope',
                function($scope) {}
            ]);
        }
    });
}(window.cloudberry);
