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
                    function($location, views) {
                        if ($location.$$path == '/config') {
                            var views = views.get('config');
                            if (!views) return;

                            var rd = "/config/" + views[0].id;
                            console.log("PATH:" + $location.$$path + " -> " + rd);
                            return rd;
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
                        views : views.get('config')
                    };
                    //$scope.activeView = views.all[$state.current.name];

                    //$rootScope.$on('$stateChangeSuccess', function(e, to) {
                        //$scope.activeView = views.all[to.name];
                    //});

                }
            ]);
        }
    });

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

            mod.controller('ConfigUsersCtrl', ['$scope',
                function($scope, $state, $stateParams) {}
            ]);
        }
    });
}(window.cloudberry);
