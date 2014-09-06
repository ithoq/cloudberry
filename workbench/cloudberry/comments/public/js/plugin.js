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
                template: "comments/admin.html",
                controller: "CommentsAdminCtrl"
            });

            mod.controller('CommentsAdminCtrl', ['$scope', '$controller',
                function($scope, $controller) {

                }
            ]);
        }
    });
}(window.cloudberry);
