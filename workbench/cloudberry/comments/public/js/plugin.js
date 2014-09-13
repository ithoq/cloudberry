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

            mod.controller('ItemDetailsCommentsCtrl', ['$scope', 'commentsRepository',
                function($scope, commentsRepository) {
                    $scope.comments = {
                        list: [],
                        newComment: ""
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
}(window.cloudberry);
