define("cloudberry/core", ['plugins/router'],
    function(router) {
        var views = {};
        var actions = {};
        var routers = {};

        return {
            views: {
                register: function(v) {
                    var parent = v.parent || '_';
                    if (views[parent] === undefined) views[parent] = [];
                    views[parent].push(v);
                },
                get: function(parent) {
                    return views[parent || '_'] || [];
                }
            },
            actions: {
                register: function(ac) {
                    var t = ac.type || '_';
                    if (actions[t] === undefined) actions[t] = [];
                    actions[t].push(ac);
                },
                get: function(type) {
                    return actions[type || '_'] || [];
                }
            },
            routers: {
                main : function() {
                    if (!routers['_']) routers['_'] = router.createChildRouter();
                    return routers['_'];
                },
                get : function(parent) {
                    if (!routers[parent]) routers[parent] = this.main().createChildRouter();
                    return routers[parent];
                }
            }
        }
    });

define("cloudberry/session", ['jquery', 'cloudberry/core_service', 'durandal/app'],
    function($, service, da) {
        var _session = false;
        var _end = function() {
            //$rootScope.features = {};
            //$rootScope.session = null;
            da.trigger('session:end');
        };
        da.on('error:unauthorized').then(_end);

        var _set = function(s) {
            //$rootScope.features = s.features;

            if (!s || !s.user) {
                _session = {
                    id: false,
                    user: null
                }
            } else {
                _session = s;
                _session.user.admin = s.user.type == 'a';
            }
            //$rootScope.session = _session;
            da.trigger('session:start', _session);
        };
        //_set();
        return {
            get: function() {
                return _session;
            },
            end: function() {
                var df = $.Deferred();
                service.get('session/logout').done(function(s) {
                    df.resolve(s);
                    if (s) _end(s);
                }).fail(df.reject);
                return df.promise();
            },
            init: function() {
                var df = $.Deferred();
                service.get('session/info').done(function(s) {
                    df.resolve(s);
                    if (s) _set(s);
                }).fail(df.reject);
                return df.promise();
            },
            authenticate: function(username, pw, remember) {
                return service.post('session/login', {
                    name: username,
                    password: pw,
                    remember: !!remember
                }).done(function(s) {
                    _set(s);
                });
            }
        };
    });

define("cloudberry/service", ['jquery', 'cloudberry/config', 'durandal/app'],
    function($, config, da) {
        var _sessionId = false;

        da.on('session:start').then(function(session) {
            _sessionId = session.id;
        });
        da.on('session:end').then(function(session) {
            _sessionId = false;
        });


        var _limitedHttpMethods = !!config['limited-http-methods'];
        var _restPath = config['rest-path'];

        var _serviceInstance = function(prefix) {
            var urlFn = function(u, full) {
                if (u.startsWith('http')) return u;
                var url = _restPath + "r.php/" + (prefix || '') + u;
                if (!full) return url;
                return "TODO" + url; //cloudberry.App.pageUrl + url;
            };
            var doRequest = function(type, url, data) {
                var t = type;
                var diffMethod = (_limitedHttpMethods && (t == 'PUT' || t == 'DELETE'));
                if (diffMethod) t = 'POST';

                return (function(sid) {
                    return $.ajax({
                        type: t,
                        url: urlFn(url),
                        processData: false,
                        data: data ? JSON.stringify(data) : null,
                        contentType: 'application/json',
                        dataType: 'json',
                        beforeSend: function(xhr) {
                            if (sid)
                                xhr.setRequestHeader("cloudberry-session-id", sid);
                            if (_limitedHttpMethods || diffMethod)
                                xhr.setRequestHeader("cloudberry-http-method", type);
                        }
                    }).pipe(function(r) {
                        if (!r) {
                            return $.Deferred().reject({
                                code: 999
                            });
                        }
                        return r;
                    }, function(xhr) {
                        var df = $.Deferred();

                        // if session has expired since starting request, ignore it
                        if (_sessionId != sid) return df;

                        var error = false;
                        var data = false;

                        if (xhr.responseText && xhr.responseText.startsWith('{')) {
                            try {
                                error = JSON.parse($.trim(xhr.responseText));
                            } catch (e) {
                                error = {
                                    code: 999,
                                    details: "Could not parse error JSON, response: [" + xhr.responseText + "]"
                                };
                            }
                        }
                        if (!error) error = {
                            code: 999
                        }; //unknown

                        var failContext = {
                            handled: false
                        }
                        if (error.code == 100 && _sessionId) {
                            app.trigger('error:unauthorized');
                            failContext.handled = true;
                        }
                        // push default handler to end of callback list
                        setTimeout(function() {
                            df.fail(function(err) {
                                if (!failContext.handled) window.alert(JSON.stringify(err)); //TODO cloudberry.ui.dialogs.showError(err);
                            });
                        }, 0);
                        return df.rejectWith(failContext, [error]);
                    }).promise()
                }(_sessionId));
            };
            return {
                prefix: prefix,
                url: urlFn,

                get: function(url) {
                    return doRequest("GET", url, null);
                },

                post: function(url, data) {
                    return doRequest("POST", url, data);
                },

                put: function(url, data) {
                    return doRequest("PUT", url, data);
                },

                del: function(url, data) {
                    return doRequest("DELETE", url, data);
                },

                withPrefix: function(prefix) {
                    return _serviceInstance(prefix);
                }
            };
        };
        return {
            get: function(prefix) {
                return _serviceInstance(prefix || "");
            }
        };
    }
);

define("cloudberry/core_service", ['cloudberry/service'],
    function(service) {
        var cs = service.get("api/v1/");
        return cs;
    }
);

define("cloudberry/filesystem", ['cloudberry/core_service', 'cloudberry/permissions', 'durandal/app'],
    function(service, permissions, da) {
        var _roots = [];
        var _rootsById = [];
        da.on('session:start').then(function(session) {
            _roots = session.folders ? session.folders : [];
            $.each(_roots, function(i, r) {
                _rootsById[r.id] = r;
            })
        });
        da.on('session:end').then(function(session) {
            _roots = [];
            _rootsById = {};
        });

        return {
            roots: function() {
                return _roots;
            },
            root: function(id) {
                return _rootsById[id];
            },
            rootsById: function() {
                return _rootsById;
            },
            folderInfo: function(folderId) {
                return service.post("filesystem/" + folderId + "/info/", {
                    children: true,
                    hierarchy: true,
                    permissions: true
                }).pipe(function(r) {
                    permissions.putFilesystemPermissions(folderId, r.permissions);

                    var folder = r.folder;
                    var data = r;
                    data.items = r.children; //r.folders.slice(0).concat(r.files);
                    data.hierarchy = r.hierarchy;
                    //if (r.hierarchy)
                    //    r.hierarchy[0] = _rootsById[r.hierarchy[0].id];
                    return data;
                });
            }
        };
    }
);

define("cloudberry/platform", [
    "durandal/composition",
    "knockout",
    "jquery",
    "bootstrap",
    "knockout-bootstrap"
], function(composition, ko, $) {

});
