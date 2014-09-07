! function(cloudberry) {
    'use strict';

    cloudberry.modules.register({
        id: 'cloudberry.comments',

        setup: function(h, mod, gettext) {
            gettext("comments_configViewTitle");
            h.registerView('comments', {
                titleKey: "comments_adminViewTitle",
                requiresAdmin: true,
                icon: "fa-comment",
                parent: "config",
                url: "/comments",
                template: "cloudberry.comments:admin.html",
                controller: "CommentsAdminCtrl"
            });

            mod.controller('CommentsAdminCtrl', ['$scope', '$controller',
                function($scope, $controller) {

                }
            ]);

            gettext("comments_itemDetails_viewTitle");
            h.registerItemDetails('itemDetails_comments', {
                controller: "ItemDetailsCommentsCtrl",
                titleKey: "comments_itemDetails_viewTitle",
                template: "cloudberry.comments:itemdetails.html"
            });

            mod.controller('ItemDetailsCommentsCtrl', ['$scope',
                function($scope) {
                    $scope.ItemDetailsCommentsCtrl = function(ctx) {
                        console.log('item comments ' + ctx.item.id);
                        $scope.item = ctx.item;
                        $scope.comments = null;
                    };
                }
            ]);
        }
    });
}(window.cloudberry);
