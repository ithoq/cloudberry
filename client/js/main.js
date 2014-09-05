! function(cloudberry) {
    'use strict';

    /* Main */
    cloudberry.modules.register({
        id: 'cloudberry.main',

        setup: function(h, mod, gettext) {
            h.registerView('main', {
                id: 'main',
                abstract: true,
                controller: "MainCtrl",
                template: "main.html"
            });

            mod.controller('MainCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'views', 'actions',
                function($scope, $rootScope, $state, $stateParams, views, actions) {
                    var updateViews = function(to) {
                        $scope.activeView = [views.all[to.name]];
                        var cur = to;
                        while (true) {
                            if (!cur.parent) break;
                            cur = views.all[cur.parent];
                            $scope.activeView.unshift(cur);
                        }
                    };
                    $scope.views = views.get('main');
                    updateViews($state.current);
                    $scope.sessionActions = actions.getType('session', true);

                    $rootScope.$on('$stateChangeSuccess', function(e, to) {
                        updateViews(to);
                    });
                }
            ]);

            var ChangePasswordController = function($scope, $modalInstance, user) {
                $scope.user = user;

                $scope.ok = function() {
                    $modalInstance.close();
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            };

            h.registerDialog({
                id: "changePassword",
                template: 'main/change_password.html',
                controller: ChangePasswordController,
                params: ['user']
            });
            gettext('user_changePassword');
            h.registerAction({
                id: 'user/change_pw',
                type: 'session',
                titleKey: 'user_changePassword',
                permissions: {
                    'change_password': true
                },
                handler: ["dialogs",
                    function(user, dialogs) {
                        dialogs.custom('changePassword', user).done(function() {
                            //TODO new pw as param? or change already in controller?
                            alert("ok");
                        });
                    }
                ]
            });

            mod.directive('popupmenuContainer', function($timeout) {
                var offset = {
                    left: 0,
                    top: 20
                }
                return function(scope, element, attributes) {
                    var $popup = element.find('.popupmenu-container'); //TODO find by class under current element
                    var containerOffset = element.offset();
                    var hidePopup = function() {
                        scope.popupmenu = null;
                        $popup.css("display", "none");
                    };
                    element.bind("click", function() {
                        hidePopup();
                    });

                    scope.showPopupmenu = function($event, parent, actions) {
                        var display;
                        var $parent = $($event.target).closest(".popupmenu-parent");
                        if (!$parent || $parent.length === 0) {
                            hidePopup();
                        } else {
                            scope.popupmenu = {
                                parent: parent,
                                items: actions
                            };
                            var parentOffset = $parent.offset();

                            $popup.css({
                                top: (parentOffset.top + offset.top) + 'px',
                                left: (parentOffset.left + offset.left) + 'px',
                                display: "block"
                            }).find(".dropdown-menu").show();
                        }
                    }
                }
            });
        }
    });
}(window.cloudberry);
