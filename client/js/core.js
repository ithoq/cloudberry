! function(cloudberry) {
    'use strict';

    /* Core */
    cloudberry.modules.push({
        id: 'cloudberry.core',

        setup: function(h, mod, gettext) {
            mod.factory('formatters', ['gettextCatalog', 'filesystem',
                function(gettextCatalog, filesystem) {
                    var _defaults = {
                        decimalSeparator: gettextCatalog.getString('number_decimalSeparator')
                    };
                    var _predefined = {};
                    return {
                        predefined: _predefined,
                        setPredefined: function(id, f) {
                            _predefined[id] = f;
                        },
                        ByteSize: function(nf) {
                            this.format = function(b) {
                                if (!window.def(b)) return "";

                                var bytes = b;
                                if (typeof(b) === "string") {
                                    bytes = parseInt(bytes, 10);
                                    if (isNaN(bytes)) return "";
                                } else if (typeof(b) !== "number") return "";

                                //TODO params

                                if (bytes < 1024)
                                    return nf.format(bytes) + " " + gettextCatalog.getPlural(bytes, 'fileSize_byte', 'fileSize_bytes');

                                if (bytes < (1024 * 1024)) {
                                    var kilobytes = bytes / 1024;
                                    return nf.format(kilobytes) + " " + gettextCatalog.getPlural(kilobytes, 'fileSize_kilobyte', 'fileSize_kilobytes');
                                }

                                if (bytes < (1024 * 1024 * 1024)) {
                                    var megabytes = bytes / (1024 * 1024);
                                    return nf.format(megabytes) + " " + gettextCatalog.getPlural(megabytes, 'fileSize_megabyte', 'fileSize_megabytes');
                                }

                                var gigabytes = bytes / (1024 * 1024 * 1024);
                                return nf.format(gigabytes) + " " + gettextCatalog.getPlural(gigabytes, 'fileSize_gigabyte', 'fileSize_gigabytes');
                            };
                        },
                        Timestamp: function(fmt) {
                            this.format = function(ts) {
                                if (ts == null) return "";
                                if (typeof(ts) === 'string') ts = cloudberry.utils.parseInternalTime(ts);
                                return moment(ts).format(fmt);
                            };
                        },
                        Number: function(precision, unit, ds) {
                            this.format = function(n) {
                                if (!window.def(n) || typeof(n) !== 'number') return "";

                                var _ds = ds || _defaults.decimalSeparator;
                                var _precision = precision || 2; //TODO default?
                                var s = Math.pow(10, precision);
                                var v = Math.floor(n * s) / s;
                                var sv = v.toString();
                                if (_ds) sv = sv.replace(".", _ds);
                                if (unit) return sv + " " + unit;
                                return sv;
                            };
                        },
                        FilesystemItemPath: function() {
                            this.format = function(item) {
                                if (!item) return "";
                                return filesystem.root(item.root_id).name + (item.path.length > 0 ? ":" + item.path : "");
                            }
                        }
                    };
                }
            ]).filter('formatter', ['formatters',
                function(formatters) {
                    var getFormatter = function(name, args) {
                        if (formatters.predefined[name]) return formatters.predefined[name];
                        if (name == 'ByteSize') return new formatters.ByteSize(getFormatter('Number', args));
                        if (name == 'Number') return cloudberry.utils.createObj(formatters.Number, args);
                        return null;
                    };
                    return function(input, f) {
                        input = input || '';
                        var out = input;
                        var fmt = getFormatter(f, Array.prototype.slice.call(arguments, 2));
                        if (fmt) out = fmt.format(input);
                        return out;
                    };
                }
            ]);

            mod.factory('cache', [
                function() {
                    var _cache = {};
                    return {
                        has: function(k) {
                            return !!_cache[k];
                        },
                        get: function(k) {
                            return _cache[k];
                        },
                        put: function(k, o) {
                            _cache[k] = o;
                        }
                    }
                }
            ]);

            mod.factory('permissions', ['$rootScope', 'session',
                function($rootScope, session) {
                    var _types = null;

                    var updatePermissions = function(list, permissions) {
                        $.each(cloudberry.utils.getKeys(permissions), function(i, p) {
                            list[p] = permissions[p];
                        });
                    };
                    $rootScope.$on('session/start', function(e, s) {
                        if (s.user) {
                            _types = s.data.permission_types;
                            updatePermissions(_permissions, s.data.permissions);
                        }
                    });

                    var _filesystemPermissions = {};
                    var _permissions = {};
                    var hasPermission = function(list, name, required) {
                        if (!list || list[name] === undefined) return false;
                        var v = list[name];

                        var options = _types.values[name];
                        if (!required || !options) return v == "1";

                        var ui = options.indexOf(v);
                        var ri = options.indexOf(required);
                        return (ui >= ri);
                    };
                    return {
                        init: function(types) {
                            _types = types;
                        },
                        getTypes: function() {
                            return _types;
                        },
                        putFilesystemPermissions: function(id, permissions) {
                            if (!_filesystemPermissions[id]) _filesystemPermissions[id] = {};
                            updatePermissions(_filesystemPermissions[id], permissions);
                        },
                        hasFilesystemPermission: function(item, name, required) {
                            var user = session.get().user;
                            if (!user) return false;
                            if (user.admin) return true;
                            return hasPermission(_filesystemPermissions[((typeof(item) === "string") ? item : item.id)], name, required);
                        },
                        hasPermission: function(name, required) {
                            var user = session.get().user;
                            if (!user) return false;
                            if (user.admin) return true;
                            return hasPermission(_permissions, name, required);
                        }
                    }
                }
            ]);

            mod.factory('filesystem', ['$rootScope', 'service', 'session', 'permissions', 'cache',
                function($rootScope, service, session, permissions, cache) {
                    var _roots = [];
                    var _rootsById = [];
                    $rootScope.$on('session/start', function(event, session) {
                        _roots = session.folders ? session.folders : [];
                        $.each(_roots, function(i, r) {
                            _rootsById[r.id] = r;
                        })
                    });
                    $rootScope.$on('session/end', function(event) {
                        _roots = [];
                        _rootsById = {};
                    });

                    var _canCopySingleTo = function(item, to) {
                        // cannot copy into file
                        if (to.is_file) return false;

                        // cannot copy into itself
                        if (item.id == to.id) return false;

                        // cannot copy into same location
                        if (item.parent_id == to.id) return false;
                        return true;
                    };

                    var _canMoveSingleTo = function(item, to) {
                        // cannot move into file
                        if (to.is_file) return false;

                        // cannot move folder into its own subfolder
                        if (!to.is_file && item.root_id == to.root_id && to.path.startsWith(item.path)) return false;

                        // cannot move into itself
                        if (item.id == to.id) return false;

                        // cannot move into same location
                        if (item.parent_id == to.id) return false;
                        return true;
                    };

                    var _copy = function(i, to) {
                        return cloudberry.service.post("filesystem/" + i.id + "/copy/", {
                            folder: to.id
                        }).done(function(r) {
                            $rootScope.$broadcast('filesystem/copy', {
                                items: [i],
                                to: to
                            });
                        });
                    };

                    var _copyMany = function(i, to) {
                        return cloudberry.service.post("filesystem/items/", {
                            action: 'copy',
                            items: i,
                            to: to
                        }).done(function(r) {
                            $rootScope.$broadcast('filesystem/copy', {
                                items: i,
                                to: to
                            });
                        });
                    };

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
                        folderInfo: function(id, hierarchy, requestData) {
                            var d = {
                                hierarchy: hierarchy,
                                permissions: true,
                                data: requestData
                            };
                            return service.post("filesystem/" + (id ? id : "roots") + "/folder-info", d).pipe(function(r) {
                                permissions.putFilesystemPermissions(id, r.permissions);

                                var folder = r.folder;
                                var data = r;
                                data.items = r.children;    //r.folders.slice(0).concat(r.files);
                                //if (r.hierarchy)
                                //    r.hierarchy[0] = _rootsById[r.hierarchy[0].id];
                                return data;
                            });
                        },
                        itemInfo: function(item, data) {
                            return service.post("filesystem/" + item.id + "/details/", {
                                data: data
                            }).done(function(r) {
                                permissions.putFilesystemPermissions(item.id, r.permissions);
                                if (item.parent_id && r.parent_permissions) permissions.putFilesystemPermissions(item.parent_id, r.parent_permissions);
                            });
                        },
                        getDownloadUrl: function(item) {
                            if (!item.is_file) return false;
                            var url = service.url("filesystem/" + item.id, true);
                            //TODO if (cloudberry.App.mobile)
                            //    url = url + ((url.indexOf('?') >= 0) ? "&" : "?") + "m=1";
                            return url;
                        },
                        canCopyTo: function(item, to) {
                            if (window.isArray(item)) {
                                for (var i = 0, j = item.length; i < j; i++)
                                    if (!_canCopySingleTo(item[i], to)) return false;
                                return true;
                            }

                            return _canCopySingleTo(item, to);
                        },
                        canMoveTo: function(item, to) {
                            if (window.isArray(item)) {
                                for (var i = 0, j = item.length; i < j; i++)
                                    if (!_canMoveSingleTo(item[i], to)) return false;
                                return true;
                            }

                            return _canMoveSingleTo(item, to);
                        },
                        copy: function(i, to) {
                            if (!i) return;

                            if (window.isArray(i) && i.length > 1) {
                                if (!to) {
                                    var df = $.Deferred();
                                    /*cloudberry.ui.dialogs.folderSelector({
                                        title: cloudberry.ui.texts.get('copyMultipleFileDialogTitle'),
                                        message: cloudberry.ui.texts.get('copyMultipleFileMessage', [i.length]),
                                        actionTitle: cloudberry.ui.texts.get('copyFileDialogAction'),
                                        handler: {
                                            onSelect: function(f) {
                                                $.when(mfs._copyMany(i, f)).then(df.resolve, df.reject);
                                            },
                                            canSelect: function(f) {
                                                return mfs.canCopyTo(i, f);
                                            }
                                        }
                                    });*/
                                    alert("selector");
                                    return df.promise();
                                } else
                                    return _copyMany(i, to);
                            }

                            if (window.isArray(i)) i = i[0];

                            if (!to) {
                                var df2 = $.Deferred();
                                /*cloudberry.ui.dialogs.folderSelector({
                                    title: cloudberry.ui.texts.get('copyFileDialogTitle'),
                                    message: cloudberry.ui.texts.get('copyFileMessage', [i.name]),
                                    actionTitle: cloudberry.ui.texts.get('copyFileDialogAction'),
                                    handler: {
                                        onSelect: function(f) {
                                            $.when(mfs._copy(i, f)).then(df2.resolve, df2.reject);
                                        },
                                        canSelect: function(f) {
                                            return mfs.canCopyTo(i, f);
                                        }
                                    }
                                });*/
                                alert("selector");
                                return df2.promise();
                            } else
                                return _copy(i, to);
                        }
                    }
                }
            ]);

            mod.factory('folderRepository', ['$rootScope', 'service',
                function($rootScope, service) {
                    return {
                        getAllFolders: function() {
                            return service.get('configuration/folders');
                        },
                        getFolder: function(id) {
                            if (!id) return null;
                            return service.get('configuration/folders/' + id);
                        },
                        getFolderUsers: function(id) {
                            if (!id) return [];
                            return service.get('configuration/folders/' + id + "/users/");
                        },
                        addFolder: function(f) {
                            return service.post('configuration/folders', f);
                        },
                        addFolderUsers: function(f, u) {
                            return service.post('configuration/folders/' + f.id + "/users/",
                                cloudberry.utils.extractValue(u, "id")
                            );
                        },
                        deleteFolders: function(f) {
                            return service.del("configuration/folders", {
                                ids: cloudberry.utils.extractValue(f, "id")
                            });
                        }
                    }
                }
            ]);

            mod.factory('userRepository', ['$rootScope', 'service',
                function($rootScope, service) {
                    return {
                        getAllUsers: function() {
                            return service.get('configuration/users');
                        },
                        userQuery: function(q) {
                            return service.post('configuration/users/query', q);
                        },
                        getUser: function(id) {
                            if (!id) return null;
                            return service.get('configuration/users/' + id);
                        },
                        getUserFolders: function(id) {
                            if (!id) return [];
                            return service.get('configuration/users/' + id + "/folders/");
                        },
                        addUserFolders: function(u, f) {
                            return service.post('configuration/users/' + u.id + "/folders/",
                                cloudberry.utils.extractValue(f, "id")
                            );
                        },
                        getUserGroups: function(id) {
                            if (!id) return [];
                            return service.get('configuration/users/' + id + "/groups/");
                        },
                        addUserGroups: function(u, g) {
                            return service.post('configuration/users/' + u.id + "/groups/",
                                cloudberry.utils.extractValue(g, "id")
                            );
                        },
                        addUser: function(u) {
                            return service.post('configuration/users', u);
                        },
                        deleteUsers: function(u) {
                            return service.del("configuration/users", {
                                ids: cloudberry.utils.extractValue(f, "id")
                            });
                        },
                        changePw: function(u, newPw) {
                            return service.put('configuration/users/' + u.id + "/password", {
                                "new": window.Base64.encode(newPw)
                            });
                        },
                    }
                }
            ]);

            mod.factory('c_service', ['$rootScope', 'cache', 'service',
                function($rootScope, cache, service) {
                    return {
                        get: function(url, cacheKey) {
                            var ck = cacheKey || url;
                            if (cache.has(ck)) return $.Deferred().resolve(cache.get(ck));
                            return service.get(url).done(function(r) {
                                cache.put(ck, r);
                            });
                        }
                    };
                }
            ]);

            mod.factory('service', ['$rootScope', 'settings',
                function($rootScope, settings) {
                    var _sessionId = false;
                    $rootScope.$on('session/start', function(event, session) {
                        _sessionId = session.id;
                    });
                    $rootScope.$on('session/end', function(event) {
                        _sessionId = false;
                    });
                    var limitedHttpMethods = !! settings['limited-http-methods'];
                    var urlFn = function(u, full) {
                        if (u.startsWith('http')) return u;
                        var url = settings["rest-path"] + "r.php/api/v1/" + u;
                        if (!full) return url;
                        return "TODO" + url; //cloudberry.App.pageUrl + url;
                    };
                    var doRequest = function(type, url, data) {
                        var t = type;
                        var diffMethod = (limitedHttpMethods && (t == 'PUT' || t == 'DELETE'));
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
                                    if (limitedHttpMethods || diffMethod)
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
                                    $rootScope.$broadcast('error/unauthorized');
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
                    var service = {
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
                        }
                    };
                    return service;
                }
            ]);

            mod.factory('session', ['service', '$rootScope',
                function(service, $rootScope) {
                    var _session = false;
                    var _end = function() {
                        $rootScope.features = {};
                        $rootScope.session = null;
                        $rootScope.$broadcast('session/end');
                    };
                    var _set = function(s) {
                        $rootScope.features = s.features;

                        if (!s || !s.user) {
                            _session = {
                                id: false,
                                user: null
                            }
                        } else {
                            _session = s;
                            _session.user.admin = s.user.type == 'a';
                        }
                        $rootScope.session = _session;
                        $rootScope.$broadcast('session/start', _session);
                        $rootScope.$on('error/unauthorized', _end);
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
                                remember: !! remember
                            }).done(function(s) {
                                _set(s);
                            });
                        }
                    };
                }
            ]);

            gettext('session_logout');
            h.registerAction({
                id: 'session/logout',
                type: 'session',
                icon: "fa-sign-out",
                titleKey: 'session_logout',
                handler: ["session",
                    function(ctx, session) {
                        session.end();
                    }
                ]
            });

            gettext('file_copy');
            h.registerAction({
                id: 'file/copy',
                icon: "fa-copy",
                type: 'filesystem',
                titleKey: 'file_copy',
                handler: ["filesystem",
                    function(file, filesystem) {
                        filesystem.copy(file);
                    }
                ]
            });
        }
    });

    /* Login */
    cloudberry.modules.push({
        id: 'cloudberry.login',

        setup: function(h, mod) {
            h.registerView('login', {
                url: "/login",
                template: "login.html",
                controller: "LoginCtrl"
            });

            mod.controller('LoginCtrl', ['$scope', '$rootScope', '$state', 'session',
                function($scope, $rootScope, $state, session) {
                    $scope.username = "";
                    $scope.password = "";
                    $scope.remember = false;

                    $scope.doLogin = function() {
                        session.authenticate($scope.username, $scope.password, $scope.remember);
                    };

                    $scope.reset = {
                        forgotEmail: "",
                        sendPassword: function() {
                            alert($scope.reset.forgotEmail);
                        }
                    };
                }
            ]);
        }
    });
}(window.cloudberry);
