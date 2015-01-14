define(['cloudberry/core', 'durandal/app', 'cloudberry/ui/files'], function(core, da, uif) {
    core.views.register({
        id: 'comments',
        icon: 'comment',
        parent: 'config',
        route: 'config/comments',
        titleKey: 'comments.config.title',
        hash: '#config/comments',
        moduleId: 'cloudberry/comments/config',
    });

    uif.itemDetails.registerProvider({
        id: 'cloudberry/comments',
        getRequestData: function(item) {
            return true
        },
        get: function(item) {
            return {
                titleKey: "comments.itemdetails.title",
                module: 'cloudberry/comments/itemdetails'
            }
        }
    });
});

define('cloudberry/comments/config', ['cloudberry/comments/repository'], function(repository) {
    return {
        activate: function() {
            console.log("comments/config");
        },
        getView: function() {
            //TODO util that resolves plugin url from "comments/public/templates/config"
            return '../../../workbench/cloudberry/comments/public/templates/config';
        }
    };
});

define('cloudberry/comments/itemdetails', ['cloudberry/comments/repository', 'knockout'], function(repository, ko) {
    var model = {
        item: null,
        list: null,
        comment: ko.observable(""),
    };
    var reload = function() {
        repository.getCommentsForItem(model.item).done(function(c) {
            model.list(c);
        });
    };

    return {
        activate: function(p) {
            console.log("comments/itemdetails");
            var data = p.data();
            console.log(data);

            var list = data.details && data.details["cloudberry/comments"] ? data.details["cloudberry/comments"] : null;
            model.item = data.item;
            model.list = ko.observableArray(list || []);
        },
        getView: function() {
            //TODO util that resolves plugin url from "comments/public/templates/itemdetails"
            return '../../../workbench/cloudberry/comments/public/templates/itemdetails';
        },
        model: model,
        add: function() {
            var c = model.comment();
            if (!c) return;

            repository.addItemComment(model.item, c).done(function() {
                model.comment("");
                reload();
            })
        }
    };
});

define('cloudberry/comments/repository', ['cloudberry/service'], function(service) {
    var cs = service.get("comments/v1/");
    return {
        getCommentsForItem: function(item) {
            return cs.get("items/" + item.id);
        },
        addItemComment: function(item, comment) {
            return cs.post("items/" + item.id, {
                comment: comment
            });
        },
        editComment: function(id, newComment) {
            return cs.put(id, {
                comment: newComment
            });
        },
        removeItemComment: function(item, comment) {
            return cs.del("items/" + item.id + "/" + comment.id);
        }
    };
});

/*! function(cloudberry) {
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

            mod.factory('commentsRepository', ['$rootScope', 'service', 'cache',
                function($rootScope, service, cache) {
                    var commentService = service.withPrefix("comments/v1/");

                    return {
                        getCommentsForItem: function(item) {
                            return commentService.get("items/" + item.id);
                        },
                        addItemComment: function(item, comment) {
                            return commentService.post("items/" + item.id, {
                                comment: comment
                            });
                        },
                        editComment: function(id, newComment) {
                            return commentService.put(id, {
                                comment: newComment
                            });
                        },
                        removeItemComment: function(item, comment) {
                            return commentService.del("items/" + item.id + "/" + comment.id);
                        }
                    }
                }
            ]);

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

            mod.controller('ItemDetailsCommentsCtrl', ['$scope', 'commentsRepository', 'session',
                function($scope, commentsRepository, session) {
                    $scope.comments = {
                        list: [],
                        newComment: "",
                        canEdit: function(c) {
                            if (session.get().user.admin) return true;
                            return session.get().user.id == c.user_id;
                        },
                        editComment: function(data, c) {
                            if (data.comment.length < 1) return;
                            commentsRepository.editComment(c.id, data.comment);
                        }
                    };

                    $scope.onItemDetailsCommentsCtrl = function(ctx) {
                        $scope.comments.refresh = function() {
                            commentsRepository.getCommentsForItem(ctx.item).done(function(l) {
                                $scope.comments.list = l;

                                if (!$scope.$$phase)
                                    $scope.$apply();
                            });
                        }
                        $scope.comments.onAddComment = function() {
                            if ($scope.comments.newComment.length < 1) return;
                            commentsRepository.addItemComment(ctx.item, $scope.comments.newComment).done(function() {
                                $scope.comments.newComment = "";
                                $scope.comments.refresh();
                            });
                        }
                        $scope.comments.onRemoveComment = function(c) {
                            commentsRepository.removeItemComment(ctx.item, c).done(function() {
                                $scope.comments.refresh();
                            });
                        }
                        $scope.comments.refresh();
                    };
                }
            ]);
        }
    });
}(window.cloudberry);*/
