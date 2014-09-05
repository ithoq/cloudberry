! function(cloudberry) {
    'use strict';

    cloudberry.modules.register({
        id: 'cloudberry.comments',

        setup: function(h, mod, gettext) {
            gettext("comments_configViewTitle");
            h.registerView('config_comments', {
                titleKey: "comments_configViewTitle",
                requiresAdmin: true,
                icon: "fa-comment",
                parent: "config",
                url: "/comments",
                template: "config/users.html",
                controller: "ConfigCommentsCtrl"
            });
        }
    });
}(window.cloudberry);
