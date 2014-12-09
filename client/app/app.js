requirejs.config({
    baseUrl: "app",
    paths: {
        'text': '../bower_components/requirejs-text/text',
        'durandal': '../bower_components/durandal/js',
        'plugins': '../bower_components/durandal/js/plugins',
        'transitions': '../bower_components/durandal/js/transitions',
        'knockout': '../bower_components/knockout.js/knockout',
        'jquery': '../bower_components/jquery/jquery',
        'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap',
        'underscore': '../bower_components/underscore/underscore',
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        }
    }
});

var cloudberryDefaults = {
    "localization-debug": false,
    "language": {
        "default": "en",
        "options": ["en"]
    },
    "view-url": false,
    "app-element-id": "cloudberry",
    "rest-path": "",
    "templates-path": "views/",
    "limited-http-methods": false,
    "file-view": {
        "default-view-mode": false,
        "list-view-columns": {
            "name": {
                width: 250
            },
            "size": {},
            "file-modified": {
                width: 150
            }
        },
        "actions": {
            "click": function(item) {
                return "details";
            },
            "dbl-click": function(item) {
                return "file/open";
            },
            "right-click": function(item) {
                return "menu";
            },
            "mouse-over": "quickactions"
        }
    },
    "html5-uploader": {
        maxChunkSize: 0
    },
    dnd: {
        dragimages: {
            "filesystemitem-file": "css/images/mimetypes64/empty.png",
            "filesystemitem-folder": "css/images/mimetypes64/folder.png",
            "filesystemitem-many": "css/images/mimetypes64/application_x_cpio.png"
        }
    }
};

define("cloudberry/app", ['require', 'jquery', 'durandal/system', 'durandal/app', 'durandal/viewLocator'], function(require, $, system, app, viewLocator, service, session) {
    // load deps that don't need reference
    require(['cloudberry/platform']);

    var cloudberryApp = {};

    cloudberryApp.init = function(cfg) {
        cloudberryApp.config = $.extend({}, cloudberryDefaults, cfg);

        define("cloudberry/config", function() {
            return cloudberryApp.config;
        });

        system.debug(true);

        app.title = 'Cloudberry';

        app.configurePlugins({
            router: true,
            dialog: true
        });

        app.start().then(function() {
            viewLocator.useConvention(false, cloudberryApp.config['templates-path']);

            require(['cloudberry/session'], function(session) {
                session.init(cloudberryApp.config).then(function() {
                    app.setRoot('viewmodels/shell', false, 'cloudberry');
                });
            });
        });
    };
    return cloudberryApp;
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

define("cloudberry/platform", [
    "durandal/composition",
    "knockout",
    "jquery",
    "bootstrap"
], function(composition, ko, $) {
    composition.addBindingHandler("popover", {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = ko.utils.unwrapObservable(valueAccessor());
            options.content = options.template;
            options.template = undefined;

            if (options.content.startsWith('#')) {
                var $t = $(options.content);
                if ($t.length === 0) return;

                options.content = $t.html();
                options.html = true;
            }

            var $element = $(element);
            var popover = $element.data("popover");

            if (popover)
                $.extend(popover.options, options)
            else
                $element.popover(options)
        }
    });
});

if (!window.isArray)
    window.isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(s) {
        if (!s || s.length === 0) return false;
        return this.substring(0, s.length) == s;
    }
}

if (typeof String.prototype.count !== 'function') {
    String.prototype.count = function(search) {
        var m = this.match(new RegExp(search.toString().replace(/(?=[.\\+*?\[\^\]$(){}\|])/g, "\\"), "g"));
        return m ? m.length : 0;
    }
}

if (!window.def)
    window.def = function(o) {
        return (typeof(o) != 'undefined');
    }

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    }
}

if (!Array.prototype.remove) {
    Array.prototype.remove = function(from, to) {
        if (typeof(to) == 'undefined' && typeof(from) == 'object')
            from = this.indexOf(from);
        if (from < 0) return;
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };
}

if (!window.strpos)
    window.strpos = function(haystack, needle, offset) {
        // Finds position of first occurrence of a string within another  
        // 
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/strpos
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Onno Marsman    
        // +   bugfixed by: Daniel Esteban
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        var i = (haystack + '').indexOf(needle, (offset || 0));
        return i === -1 ? false : i;
    }
